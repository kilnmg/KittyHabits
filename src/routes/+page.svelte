<script lang="ts">
	import { habits, addHabit } from '$lib/stores/habits';
	import { fade } from 'svelte/transition';
	import AsciiCat from '$lib/components/AsciiCat.svelte';
	import { formatRelativeDate, calculateStreak } from '$lib/utils/date';
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';
	import { Plus, ClipboardPlusIcon, ClipboardCheckIcon, X, Flame } from 'lucide-svelte';

	let showCreateForm = false;
	let showSaveSuccess = false;
	let draggedHabitId: string | null = null;
	let showDragInfo = true;
	let toastMessage = '';
	let showToast = false;

	// Check if user has dismissed the drag info
	if (browser) {
		showDragInfo = localStorage.getItem('dragInfoDismissed') !== 'true';
	}

	function dismissDragInfo() {
		showDragInfo = false;
		if (browser) {
			localStorage.setItem('dragInfoDismissed', 'true');
		}
	}

	function showToastMessage(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 5000);
	}

	// Create a store for habit order
	const habitOrder = writable<string[]>([]);

	// Subscribe to habits changes to update order
	$: if ($habits) {
		habitOrder.set($habits.map((h) => h.id));
	}

	// Get sorted habits based on order
	$: sortedHabits = $habitOrder.map((id) => $habits.find((h) => h.id === id)).filter(Boolean);

	function handleDragStart(e: DragEvent, habitId: string) {
		if (e.dataTransfer) {
			draggedHabitId = habitId;
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', habitId);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(e: DragEvent, targetHabitId: string) {
		e.preventDefault();
		if (!draggedHabitId || draggedHabitId === targetHabitId) return;

		const currentOrder = $habitOrder;
		const draggedIndex = currentOrder.indexOf(draggedHabitId);
		const targetIndex = currentOrder.indexOf(targetHabitId);

		const newOrder = [...currentOrder];
		newOrder.splice(draggedIndex, 1);
		newOrder.splice(targetIndex, 0, draggedHabitId);

		habitOrder.set(newOrder);
		draggedHabitId = null;
	}

	function handleDragEnd() {
		draggedHabitId = null;
	}

	let newHabit = {
		name: '',
		color: '#3498db',
		currency: '€',
		value: 0,
		history: [],
		streak: 0,
		lastEventDate: new Date().toISOString(),
		target: 1,
		unit: 'session',
		frequency: 'daily',
		step: 10
	};

	function handleSubmit() {
		addHabit(newHabit);
		newHabit = {
			name: '',
			color: '#3498db',
			currency: '€',
			value: 0,
			history: [],
			streak: 0,
			lastEventDate: new Date().toISOString(),
			target: 1,
			unit: 'session',
			frequency: 'daily',
			step: 10
		};
		showCreateForm = false;
	}

	function handleSaveHabits() {
		if (browser) {
			const habitsData = localStorage.getItem('habits');
			if (habitsData) {
				navigator.clipboard.writeText(habitsData).then(() => {
					showSaveSuccess = true;
					showToastMessage('Kitties copied! You can import them in another browser using the /import path');
					setTimeout(() => {
						showSaveSuccess = false;
					}, 2000);
				});
			}
		}
	}
</script>

<svelte:head>
	<title>KittyHabits - Track habits & treat yourself</title>
	<meta name="description" content="Track your habits and their progress" />
</svelte:head>

<div class="container">
	<header class="header">
		<div class="action-buttons">
			<button class="create-button" on:click={() => (showCreateForm = !showCreateForm)}>
				{#if showCreateForm}
					<X size={20} />
					Cancel
				{:else}
					$ New Kitty
				{/if}
			</button>
			{#if $habits.length > 0}
				<button class="copy-button" on:click={handleSaveHabits} title="Copy habits to clipboard">
					{#if showSaveSuccess}
						<ClipboardCheckIcon size={20} />
					{:else}
						<ClipboardPlusIcon size={20} />
					{/if}
				</button>
			{/if}
		</div>
	</header>

	{#if showCreateForm}
		<div class="create-form" transition:fade>
			<form on:submit|preventDefault={handleSubmit}>
				<div class="form-group">
					<label for="name">Name</label>
					<input
						type="text"
						id="name"
						bind:value={newHabit.name}
						placeholder="Habit to track, eg. Yoga, Reading, Coding, etc."
						required
					/>
				</div>

				<div class="form-group">
					<label for="color">Color</label>
					<input type="color" id="color" bind:value={newHabit.color} required />
				</div>

				<div class="form-group">
					<label for="currency">Symbol</label>
					<input
						type="text"
						id="currency"
						bind:value={newHabit.currency}
						maxlength="1"
						placeholder="€"
						required
					/>
					<p class="text-tertiary">
						The "currency" symbol in your Kitty. Eg. €, $, £, ¥, ❤️, 🤙 etc.
					</p>
				</div>

				<div class="form-group">
					<label for="step">Chip in amount</label>
					<input type="number" id="step" bind:value={newHabit.step} min="1" max="1000" required />
					<p class="text-tertiary">
						Chip in this amount in one click each time you complete this habit.
					</p>
				</div>

				<button type="submit" class="submit-button">Create</button>
				<p class="text-tertiary">You can edit your Kitty later.</p>
			</form>
		</div>
	{/if}

	<div class="habits-grid">
		{#if $habits.length === 0}
			<div class="empty-state">
				<AsciiCat value={0} name="Empty" step={10} />
				<h2>No Habits Yet</h2>
				<p>
					Create a Kitty to track your habits, when acheived increase it's value when you feel like
					treating yourself take some from your kitty.
				</p>
				<button class="create-button" on:click={() => (showCreateForm = true)}>
					Create Your First Kitty
				</button>
			</div>
		{:else}
			{#each sortedHabits as habit (habit?.id)}
				{#if habit}
					<a
						href="/habit/{habit.id}"
						class="habit-card"
						style="--habit-color: {habit.color}"
						draggable="true"
						on:dragstart={(e) => handleDragStart(e, habit.id)}
						on:dragover={handleDragOver}
						on:drop={(e) => handleDrop(e, habit.id)}
						on:dragend={handleDragEnd}
					>
						<div class="content">
							<div class="header-row">
								<h2>{habit.name}</h2>
								{#if habit.history.length > 0}
									<div class="badges">
										{#if calculateStreak(habit.history) > 0}
											<div class="streak-badge" title="Current streak">
												<Flame size={16} />
												{calculateStreak(habit.history)}
											</div>
										{/if}
									</div>
								{/if}
							</div>
							<div class="balance">
								<span class="currency">{habit.currency}</span>
								<span class="amount">{habit.value}</span>
							</div>
							{#if habit.history.length > 0}
								<div class="last-event">
									Last chip in: {formatRelativeDate(habit.history[habit.history.length - 1].date)}
								</div>
							{/if}
						</div>
						<div class="kitty-container">
							<AsciiCat value={habit.value} name={habit.name} step={habit.step || 10} />
						</div>
					</a>
				{/if}
			{/each}
		{/if}
	</div>
	{#if $habits.length > 3 && showDragInfo}
		<div class="drag-info" transition:fade>
			<p>💡 You can reorder your Kitties by dragging and dropping them</p>
			<button class="close-button" on:click={dismissDragInfo} title="Dismiss">
				<X size={20} />
			</button>
		</div>
	{/if}
</div>

{#if showToast}
	<div class="toast" transition:fade>
		<div class="toast-content">
			<Check size={20} />
			<span>{toastMessage}</span>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		background: var(--color-bg-0);
		color: var(--color-text);
		font-family: 'JetBrains Mono', 'Fira Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
	}

	.container {
		width: auto;
	}

	.header {	
		display: flex;
		justify-content: flex-end;
		margin-bottom: 2rem;
		width: 100%;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-left: auto;
	}

	.create-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-bg-1);
		color: var(--color-text);
		border: 1px solid var(--color-bg-2);
		padding: 0.5rem 1.25rem;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.create-button :global(svg) {
		stroke-width: 1.5;
	}

	.copy-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-1);
		color: var(--color-text);
		border: 1px solid var(--color-bg-2);
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		width: 2.5rem;
		height: 2.5rem;
	}

	.copy-button :global(svg) {
		stroke-width: 1.5;
	}

	.streak-badge {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: var(--color-bg-2);
		color: var(--color-text);
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		opacity: 0.9;
	}

	.streak-badge :global(svg) {
		stroke-width: 1.5;
		color: #f97316;
	}

	.habits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.habit-card {
		background: var(--color-bg-1);
		padding: 2rem;
		border-radius: 6px;
		border: 2px solid var(--habit-color);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		text-decoration: none;
		color: var(--color-text);
		transition: all 0.2s;
		font-family: inherit;
		display: flex;
		gap: 2rem;
		align-items: center;
		justify-content: space-between;
		cursor: grab;
	}

	.kitty-container {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		animation: catJam 1s ease-in-out infinite;
		transform-origin: bottom center;
	}

	.habit-card:hover .kitty-container {
		animation-play-state: paused;
	}

	@keyframes catJam {
		0%, 100% {
			transform: translateY(0) translateX(0) rotate(0deg);
		}
		25% {
			transform: translateY(-4px) translateX(2px) rotate(2deg);
		}
		50% {
			transform: translateY(0) translateX(-2px) rotate(-2deg);
		}
		75% {
			transform: translateY(-2px) translateX(1px) rotate(1deg);
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.habit-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	.habit-card h2 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--habit-color);
	}

	.balance {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.amount {
		font-size: 2rem;
		font-weight: bold;
		color: var(--color-text);
		line-height: 1;
	}

	.currency {
		font-size: 1.25rem;
		opacity: 0.7;
		color: var(--color-text);
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
	}

	.last-event {
		font-size: 0.9rem;
		opacity: 0.7;
		color: var(--color-text);
		margin-top: 0.5rem;
	}

	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 4rem 2rem;
		background: var(--color-bg-1);
		border-radius: 6px;
		border: 2px dashed var(--color-bg-2);
	}

	.empty-state h2 {
		margin: 2rem 0 1rem;
		color: var(--color-text);
		font-size: 1.5rem;
	}

	.empty-state p {
		margin: 0 0 2rem;
		color: var(--color-text);
		opacity: 0.7;
	}

	.empty-state .create-button {
		background: var(--color-theme-1);
		color: black;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.empty-state .create-button:hover {
		opacity: 0.9;
	}

	.header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.action-buttons {
		flex: 0 0 auto;
	}

	.create-form {
		background: var(--color-bg-1);
		padding: 2rem;
		border-radius: 6px;
		border: 1px solid var(--color-bg-2);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.create-form h2 {
		margin: 0 0 1.5rem 0;
		color: var(--color-text);
		font-family: inherit;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-text);
		opacity: 0.9;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-bg-2);
		border-radius: 4px;
		background: var(--color-bg-0);
		color: var(--color-text);
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-theme-1);
	}

	.form-group input[type='color'] {
		height: 40px;
		padding: 0.25rem;
		background: var(--color-bg-1);
		border: none;
	}

	.submit-button {
		background: var(--color-theme-1);
		color: black;
		border: none;
		padding: 0.5rem 1.25rem;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		width: 100%;
		transition: opacity 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.submit-button:hover {
		opacity: 0.9;
	}

	.text-tertiary {
		color: var(--color-text);
		opacity: 0.7;
	}

	.habit-card:active {
		cursor: grabbing;
	}

	.drag-info {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-bg-1);
		padding: 1rem 2rem;
		box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		z-index: 100;
	}

	.drag-info p {
		margin: 0;
		color: var(--color-text);
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--color-text);
		padding: 0.25rem;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.2s;
		width: 24px;
		height: 24px;
		min-width: 24px;
	}

	.close-button:hover {
		opacity: 1;
	}

	.close-button :global(svg) {
		stroke-width: 1.5;
	}

	.toast {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-bg-1);
		padding: 1rem 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--color-text);
	}

	.toast-content :global(svg) {
		stroke-width: 1.5;
		color: #22c55e;
	}
</style>
