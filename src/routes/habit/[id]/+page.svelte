<script lang="ts">
	import { page } from '$app/stores';
	import { habits, addTransaction, updateHabit } from '$lib/stores/habits';
	import { formatRelativeDate, calculateStreak } from '$lib/utils/date';
	import AsciiCat from '$lib/components/AsciiCat.svelte';
	import type { Habit } from '$lib/types/habit';
	import { fade } from 'svelte/transition';
	import confetti from 'canvas-confetti';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Pencil, Trash2, List, Calendar, BarChart2, X, Flame, BanknoteArrowDown } from 'lucide-svelte';

	type ViewMode = 'calendar' | 'list' | 'chart';

	let currentView: ViewMode = 'list';

	const congratulatoryMessages = [
		'Legendary! See you tomorrow! 🌟',
		'Absolutely crushing it! Come back for more! 💪',
		'Unstoppable force! Keep the streak alive! 🔥',
		"Pure excellence! Can't wait for your next entry! ⚡",
		"Mind-blowing progress! Don't stop now! 🚀",
		"Outstanding achievement! Tomorrow's waiting! 🎯",
		'Brilliant work! Keep the momentum going! 💫',
		"You're a habit-building machine! See you soon! 🤖",
		"Phenomenal effort! Can't wait to see what's next! 🌈",
		'Absolutely stellar! Keep the streak alive! ⭐',
		"Unbelievable progress! Tomorrow's your day! 💖",
		"Pure greatness! Don't break the chain! 🔗",
		'Absolutely crushing it! See you tomorrow! 💥',
		'Mind-blowing dedication! Keep it rolling! 🎪',
		"Unstoppable momentum! Can't wait for more! 🏃",
		"Legendary streak! Tomorrow's waiting! 👑",
		'Absolutely phenomenal! Keep the fire burning! 🔥',
		'Pure excellence! See you soon! 🌟',
		'Unbelievable progress! Keep the streak alive! 🎯',
		"Absolutely crushing it! Tomorrow's your day! 💪"
	];

	// Get the current habit based on the URL parameter
	$: habit = $habits.find((h) => h.id === $page.params.id);

	// Calculate additional habit information
	$: lastUpdated = habit?.history?.[0]?.date ? formatRelativeDate(habit.history[0].date) : 'Never';
	$: streak = habit?.history ? calculateStreak(habit.history) : 0;

	$: maxValue = (habit?.step || 10) * 100;
	$: minValue = -maxValue;

	let transactionValue = 0;
	let showForm = false;
	let showEditForm = false;
	let editedHabit: Partial<Habit> = {
		name: '',
		color: '#3498db',
		currency: '€',
		value: 0,
		history: [],
		step: 10
	};

	$: if (habit) {
		editedHabit = {
			name: habit.name,
			color: habit.color,
			currency: habit.currency,
			value: habit.value,
			history: habit.history,
			step: habit.step || 10
		};
	}

	let showConfetti = false;
	let isLoading = false;
	let isChipInLoading = false;
	let isChipOutLoading = false;
	let countdown = 0;
	let countdownInterval: number;
	let currentMessage = '';
	let showDeleteConfirmation = false;
	let showChipOutModal = false;
	let chipOutAmount = 0;

	// Build a set of all dates with positive activity
	$: positiveActivityDates = new Set(
		habit?.history?.filter(t => t.value > 0).map(t => new Date(t.date).toISOString().split('T')[0]) || []
	);

	function getRandomMessage() {
		return congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)];
	}

	function startChipInCountdown() {
		countdown = 60;
		currentMessage = getRandomMessage();
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(countdownInterval);
				isChipInLoading = false;
			}
		}, 1000);
	}

	function startChipOutCountdown() {
		countdown = 60;
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(countdownInterval);
				isChipOutLoading = false;
			}
		}, 1000);
	}

	function handleSubmit() {
		if (!habit || isChipInLoading) return;
		isChipInLoading = true;
		addTransaction(habit.id, habit.step || 10);
		showForm = false;
		if (browser) {
			confetti({
				particleCount: 100,
				spread: 70,
				origin: { y: 0.6 },
				colors: ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB', '#98FB98']
			});
		}
		startChipInCountdown();
	}

	function handleEditSubmit() {
		if (!habit) return;
		updateHabit(habit.id, editedHabit);
		showEditForm = false;
	}

	function handleDelete() {
		if (!habit) return;
		habits.update((h) => h.filter((h) => h.id !== habit.id));
		goto('/');
	}

	function handleChipOut() {
		if (!habit || isChipOutLoading || chipOutAmount <= 0) return;
		isChipOutLoading = true;
		addTransaction(habit.id, -chipOutAmount);
		showChipOutModal = false;
		chipOutAmount = 0;
		startChipOutCountdown();
	}

	// Format date for display
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}

	// Get transactions grouped by date for list view
	$: transactionsByDateList =
		habit?.history?.reduce(
			(acc, transaction) => {
				const date = new Date(transaction.date).toISOString().split('T')[0];
				if (!acc[date]) {
					acc[date] = {
						date,
						total: 0,
						transactions: [],
						isStreakDay: false
					};
				}
				acc[date].total += transaction.value;
				acc[date].transactions.push(transaction);
				return acc;
			},
			{} as Record<
				string,
				{ date: string; total: number; transactions: typeof habit.history; isStreakDay: boolean }
			>
		) || {};

	// Calculate streaks for list view
	$: Object.entries(transactionsByDateList).forEach(([dateString, dayData]) => {
		const date = new Date(dateString);
		const yesterday = new Date(date);
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayString = yesterday.toISOString().split('T')[0];
		const hasYesterdayActivity = transactionsByDateList[yesterdayString]?.total > 0;

		const tomorrow = new Date(date);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowString = tomorrow.toISOString().split('T')[0];
		const hasTomorrowActivity = transactionsByDateList[tomorrowString]?.total > 0;

		// A day is part of a streak if it has activity and either the previous or next day has activity
		dayData.isStreakDay = dayData.total > 0 && (hasYesterdayActivity || hasTomorrowActivity);
	});

	$: sortedDates = Object.values(transactionsByDateList).sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	// Get monthly totals for chart view
	$: monthlyTotals =
		habit?.history?.reduce(
			(acc, transaction) => {
				const date = new Date(transaction.date);
				const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
				if (!acc[monthKey]) {
					acc[monthKey] = {
						month: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
						total: 0,
						count: 0,
						negativeCount: 0,
						streakDays: 0
					};
				}
				acc[monthKey].total += transaction.value;
				if (transaction.value > 0) {
					acc[monthKey].count++;
				} else if (transaction.value < 0) {
					acc[monthKey].negativeCount++;
				}

				// Improved streak logic: a day is part of a streak if it has positive activity and either the previous or next day has positive activity
				if (transaction.value > 0) {
					const thisDay = new Date(date);
					thisDay.setHours(0, 0, 0, 0);
					const prevDay = new Date(thisDay);
					prevDay.setDate(thisDay.getDate() - 1);
					const nextDay = new Date(thisDay);
					nextDay.setDate(thisDay.getDate() + 1);

					const hasPrevDayActivity = habit.history.some((t) => {
						const tDate = new Date(t.date);
						tDate.setHours(0, 0, 0, 0);
						return t.value > 0 && tDate.getTime() === prevDay.getTime();
					});
					const hasNextDayActivity = habit.history.some((t) => {
						const tDate = new Date(t.date);
						tDate.setHours(0, 0, 0, 0);
						return t.value > 0 && tDate.getTime() === nextDay.getTime();
					});
					if (hasPrevDayActivity || hasNextDayActivity) {
						acc[monthKey].streakDays++;
					}
				}

				return acc;
			},
			{} as Record<string, { month: string; total: number; count: number; negativeCount: number; streakDays: number }>
		) || {};

	$: sortedMonths = Object.values(monthlyTotals).sort((a, b) => {
		const aDate = new Date(a.month);
		const bDate = new Date(b.month);
		return bDate.getTime() - aDate.getTime();
	});

	// Get current month's dates
	$: currentDate = new Date();
	$: currentMonth = currentDate.getMonth();
	$: currentYear = currentDate.getFullYear();
	$: firstDayOfMonth = new Date(currentYear, currentMonth, 1);
	$: lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
	$: daysInMonth = lastDayOfMonth.getDate();
	$: firstDayOfWeek = firstDayOfMonth.getDay();

	// Generate calendar grid
	$: calendarDays = Array.from({ length: 42 }, (_, i) => {
		const dayOffset = i - firstDayOfWeek;
		const date = new Date(currentYear, currentMonth, dayOffset + 1);
		const dateString = date.toISOString().split('T')[0];
		const isCurrentMonth = date.getMonth() === currentMonth;
		const dayData = transactionsByDateList[dateString] || {
			date: dateString,
			total: 0,
			transactions: []
		};

		// Streak logic: highlight all days that are part of a streak (2+ consecutive days with positive activity)
		const hasPrev = positiveActivityDates.has(
			new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1).toISOString().split('T')[0]
		);
		const hasNext = positiveActivityDates.has(
			new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString().split('T')[0]
		);
		const isStreakDay = positiveActivityDates.has(dateString) && (hasPrev || hasNext);

		return {
			dateString,
			isCurrentMonth,
			dayNumber: date.getDate(),
			isStreakDay,
			total: dayData.total,
			transactions: dayData.transactions
		};
	});

	let selectedDate: string | null = null;
	let showTransactionDetails = false;

	function changeMonth(delta: number) {
		currentDate = new Date(currentYear, currentMonth + delta, 1);
	}

	function showDayDetails(dateString: string) {
		selectedDate = dateString;
		showTransactionDetails = true;
	}

	function initializeCalendarToLatestTransaction() {
		if (habit?.history && habit.history.length > 0) {
			const latestTransaction = habit.history[0];
			currentDate = new Date(latestTransaction.date);
		}
	}

	// Cleanup interval on component destroy
	onDestroy(() => {
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
	});
</script>

<div class="habit-details">
	<nav class="breadcrumb">
		<a href="/">← Back to Habits</a>
		<div class="header-buttons">
			<button class="icon-button" on:click={() => (showChipOutModal = true)}>
				<BanknoteArrowDown size={20} />
			</button>
			<button class="icon-button" on:click={() => (showEditForm = !showEditForm)} title="Edit">
				<Pencil size={20} />
			</button>
			<button
				class="icon-button delete-button"
				on:click={() => (showDeleteConfirmation = true)}
				title="Delete"
			>
				<Trash2 size={20} />
			</button>
		</div>
	</nav>

	{#if showEditForm}
		<div class="create-form" transition:fade>
			<h2>Edit</h2>
			<form on:submit|preventDefault={handleEditSubmit}>
				<div class="form-group">
					<label for="name">Name</label>
					<input
						type="text"
						id="name"
						bind:value={editedHabit.name}
						placeholder="Enter habit name"
						required
					/>
				</div>

				<div class="form-group">
					<label for="color">Color</label>
					<input type="color" id="color" bind:value={editedHabit.color} required />
				</div>

				<div class="form-group">
					<label for="currency">Symbol</label>
					<input
						type="text"
						id="currency"
						bind:value={editedHabit.currency}
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
					<input
						type="number"
						id="step"
						bind:value={editedHabit.step}
						min="1"
						max="1000"
						required
					/>
					<p class="text-tertiary">
						Chip in this amount in one click each time you complete this habit.
					</p>
				</div>

				<button type="submit" class="submit-button">Save Changes</button>
			</form>
		</div>
	{/if}

	{#if showDeleteConfirmation}
		<div class="delete-confirmation" transition:fade>
			<div class="confirmation-content">
				<h3>Delete {habit?.name}?</h3>
				<p>Are you sure you want to delete this habit? This action cannot be undone.</p>
				<div class="confirmation-buttons">
					<button class="cancel-button" on:click={() => (showDeleteConfirmation = false)}
						>Cancel</button
					>
					<button class="delete-button" on:click={handleDelete}>Delete</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showChipOutModal}
		<div class="modal" transition:fade>
			<div class="modal-content">
				<h3>Chip Out from {habit?.name}</h3>
				<div class="form-group">
					<label for="chipOutAmount">Amount to withdraw</label>
					<input
						type="number"
						id="chipOutAmount"
						bind:value={chipOutAmount}
						min="1"
						max={habit?.value || 0}
						step={habit?.step || 10}
						placeholder="Enter amount"
					/>
				</div>
				<div class="modal-buttons">
					<button
						class="cancel-button"
						on:click={() => {
							showChipOutModal = false;
							chipOutAmount = 0;
						}}
					>
						Cancel
					</button>
					<button
						class="submit-button"
						on:click={handleChipOut}
						disabled={chipOutAmount <= 0 || chipOutAmount > (habit?.value || 0) || isChipOutLoading}
					>
						{#if isChipOutLoading}
							Processing... ({countdown}s)
						{:else}
							Withdraw {habit?.currency}{chipOutAmount}
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<header class="habit-header" style="background-color: {habit?.color}">
		<div class="header-content">
			<div class="header-left">
				<div class="header-row">
					<h2>{habit?.name}</h2>
					{#if habit?.history && habit?.history.length > 0}
						<div class="badges">
							{#if calculateStreak(habit?.history) > 0}
								<div class="streak-badge" title="Current streak">
									<Flame size={16} />
									{calculateStreak(habit?.history)}
								</div>
							{/if}
						</div>
					{/if}
				</div>
				
				<div class="balance">
					<span class="amount">{habit?.currency}{habit?.value}</span>
				</div>
			</div>
			<div class="header-right">
				{#if habit}
					<AsciiCat value={habit.value} name={habit.name} large={true} step={habit.step || 10} />
				{/if}
			</div>
		</div>
	</header>

	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<button
				type="submit"
				class="chip-in"
				style="border-color: {habit?.color}; color: {habit?.color}"
				disabled={isChipInLoading}
			>
				<div class="button-content">
					{#if isChipInLoading}
						<div class="loading-bar-container">
							<div
								class="loading-bar"
								style="width: {((60 - countdown) / 60) * 100}%; background-color: {habit?.color}"
							></div>
						</div>
						<span class="loading-text">{currentMessage} ({countdown}s)</span>
					{:else}
						Chip in {habit?.currency}{habit?.step || 10}
					{/if}
				</div>
			</button>
		</div>
	</form>

	<section class="transactions">
		<div class="section-header">
			<h2>History</h2>
			<!-- <div class="view-switcher">
				<button
					class="view-button"
					class:active={currentView === 'list'}
					on:click={() => (currentView = 'list')}
					title="List View"
				>
					<List size={20} />
				</button>
				<button
					class="view-button"
					class:active={currentView === 'calendar'}
					on:click={() => {
						currentView = 'calendar';
						initializeCalendarToLatestTransaction();
					}}
					title="Calendar View"
				>
					<Calendar size={20} />
				</button>
				<button
					class="view-button"
					class:active={currentView === 'chart'}
					on:click={() => (currentView = 'chart')}
					title="Chart View"
				>
					<BarChart2 size={20} />
				</button>
			</div> -->
		</div>

		<!-- {#if currentView === 'calendar'}
			<div class="calendar-header">
				<button class="nav-button" on:click={() => changeMonth(-1)}>←</button>
				<h3>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
				<button class="nav-button" on:click={() => changeMonth(1)}>→</button>
			</div>
			<div class="calendar-grid">
				<div class="calendar-weekdays">
					{#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
						<div class="weekday">{day}</div>
					{/each}
				</div>
				<div class="calendar-days">
					{#each calendarDays as day}
						<div
							class="calendar-day"
							class:other-month={!day.isCurrentMonth}
							class:has-activity={day.total !== 0}
							class:streak-border={day.isStreakDay}
							on:click={() => day.total !== 0 && showDayDetails(day.dateString)}
						>
							<div class="day-number">{day.dayNumber}</div>
							{#if day.total !== 0}
								<div class="day-stats">
									<div class="circles-container">
										<div class="count-circle" style="background-color: {habit?.color}">
											{day.transactions.filter(t => t.value > 0).length}x
										</div>
										{#if day.transactions.some(t => t.value < 0)}
											<div class="count-circle negative">
												{day.transactions.filter(t => t.value < 0).length}
											</div>
										{/if}
									</div>
									<div
										class="day-value"
										class:positive={day.total > 0}
										class:negative={day.total < 0}
									>
										{day.total > 0 ? '+' : ''}{habit?.currency}{day.total}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div> -->
			<!-- {:else if currentView === 'list'} -->
			<div class="list-view">
				{#each sortedDates as dayData}
					<div class="day-group">
						<div class="day-header">
							<div class="day-date">
								{new Date(dayData.date).toLocaleDateString(undefined, {
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</div>
							<div class="day-header-right">
								<div
									class="day-total"
									class:positive={dayData.total > 0}
									class:negative={dayData.total < 0}
								>
									{dayData.total > 0 ? '+' : ''}{habit?.currency}{dayData.total}
								</div>
								<div class="circles-container">
									<div class="count-circle" style="background-color: {habit?.color}">
										{dayData.transactions.filter(t => t.value > 0).length}x
									</div>
									{#if dayData.transactions.some(t => t.value < 0)}
										<div class="count-circle negative">
											{dayData.transactions.filter(t => t.value < 0).length}
										</div>
									{/if}
								</div>

							</div>
						</div>
						<div class="transactions-list">
							{#each dayData.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) as transaction}
								<div class="transaction">
									<div class="time">
										{new Date(transaction.date).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</div>
									<div class="amount" class:negative={transaction.value < 0}>
										{transaction.value > 0 ? '+' : ''}{habit?.currency}{transaction.value}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		<!-- {:else if currentView === 'chart'}
			<div class="chart-view">
				{#each sortedMonths as monthData}
					<div class="month-bar">
						<div class="month-label">{monthData.month}</div>
						<div class="bar-container">
							<div
								class="bar"
								style="width: {(Math.abs(monthData.total) /
									Math.max(...sortedMonths.map((m) => Math.abs(m.total)))) *
									100}%; background-color: {monthData.total >= 0 ? '#22c55e' : '#ef4444'}"
							></div>
						</div>
						<div class="month-stats">
							<div
								class="month-total"
								class:positive={monthData.total > 0}
								class:negative={monthData.total < 0}
							>
								<span class="total-flex">
									{monthData.total > 0 ? '+' : ''}<span>{habit?.currency}{monthData.total}</span>
								</span>
							</div>
							<div class="month-activity">
								<div class="circles-container">
									<div class="count-circle" style="background-color: {habit?.color}">
										{monthData.count}x
									</div>
									{#if monthData.negativeCount > 0}
										<div class="count-circle negative">
											{monthData.negativeCount}
										</div>
									{/if}
								</div>
								{#if monthData.streakDays >= 2}
									<div class="streak-badge streak-flex" title="Streak">
										<span>🔥</span>
										<span>{monthData.streakDays}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div> -->
		<!-- {/if} -->
	</section>

	{#if showTransactionDetails && selectedDate}
		<div class="modal" transition:fade>
			<div class="modal-content">
				<h3>Transactions for {new Date(selectedDate).toLocaleDateString()}</h3>
				<div class="transaction-list">
					{#each transactionsByDateList[selectedDate]?.transactions || [] as transaction}
						<div class="transaction">
							<div class="time">
								{new Date(transaction.date).toLocaleTimeString([], {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</div>
							<div class="amount" class:negative={transaction.value < 0}>
								{transaction.value > 0 ? '+' : ''}{habit?.currency}{transaction.value}
							</div>
						</div>
					{/each}
				</div>
				<div class="modal-buttons">
					<button class="cancel-button" on:click={() => (showTransactionDetails = false)}>
						<X size={20} />
						Close
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.habit-details {
		width: auto;
	}

	.breadcrumb {
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.breadcrumb a {
		color: var(--color-text-2);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.habit-header {
		padding: 2rem;
		border-radius: 8px;
		color: white;
		margin-bottom: 2rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: left;
		gap: 2rem;
	}

	.balance .amount {
		font-size: 1.5rem;
		font-weight: bold;
	}

	.transactions {
		background: var(--color-bg-1);
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.button-group {
		display: flex;
		gap: 1rem;
	}

	.chip-in {
		font-size: 1.5rem;
		padding: 1.5rem;
		width: 100%;
		transition: all 0.2s ease;
		background: transparent;
		border: 3px solid;
		border-radius: 8px;
		font-weight: bold;
		box-shadow: none;
		position: relative;
		overflow: hidden;
	}

	.chip-out {
		opacity: 0.8;
	}

	.chip-out:hover:not(:disabled) {
		opacity: 1;
	}

	.button-content {
		position: relative;
		z-index: 1;
	}

	.loading-bar-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.loading-bar {
		height: 100%;
		transition: width 1s linear;
		opacity: 0.2;
	}

	.loading-text {
		position: relative;
		z-index: 2;
	}

	.chip-in:hover:not(:disabled) {
		transform: scale(1.02);
		background: transparent;
	}

	.chip-in:active:not(:disabled) {
		transform: scale(0.98);
		background: transparent;
	}

	.chip-in:disabled {
		opacity: 1;
		cursor: not-allowed;
	}

	.streak-badge {
		background: var(--color-bg-2);
		color: var(--color-text);
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		opacity: 0.9;
	}

	.submit-button:hover {
		opacity: 0.9;
	}

	.transaction-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.transaction {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--color-bg-2);
		border-radius: 4px;
	}

	.transaction .date {
		color: var(--color-text);
		opacity: 0.7;
	}

	.transaction .amount {
		font-weight: bold;
		color: #22c55e;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.transaction .amount.negative {
		color: #ef4444;
	}

	.habit-header h1 {
		margin: 0 0 1rem 0;
		font-size: 2rem;
		text-transform: capitalize;
		text-align: left;
	}

	.balance {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		align-items: left;
	}

	@media (max-width: 800px) {
		.habit-header h1 {
			font-size: 1.5rem;
		}
		.balance .amount {
			font-size: 2rem;
		}
	}

	.create-button {
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

	.create-button:hover {
		background: var(--color-bg-2);
		border-color: var(--color-theme-1);
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
		opacity: 0.7;
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

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--color-text);
		opacity: 0.7;
		background: var(--color-bg-2);
		border-radius: 4px;
	}

	.delete-confirmation {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.confirmation-content {
		background: var(--color-bg-1);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-width: 400px;
		width: 90%;
	}

	.confirmation-content h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
	}

	.confirmation-content p {
		margin: 0 0 1.5rem 0;
		color: var(--color-text);
		opacity: 0.8;
	}

	.confirmation-buttons {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.cancel-button {
		background: var(--color-bg-2);
		color: var(--color-text);
		border: none;
		padding: 0.5rem 1.25rem;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.delete-button {
		background: #ef4444;
		color: white;
		border: none;
		padding: 0.5rem 1.25rem;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.delete-button:hover {
		opacity: 0.9;
	}

	.header-buttons {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.chip-out-button {
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

	.chip-out-button:hover {
		background: var(--color-bg-2);
		border-color: var(--color-theme-1);
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--color-bg-1);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-width: 400px;
		width: 90%;
	}

	.modal-content h3 {
		margin: 0 0 1.5rem 0;
		color: var(--color-text);
	}

	.modal-buttons {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.modal-buttons button {
		padding: 0.5rem 1.25rem;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.modal-buttons button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.text-tertiary {
		color: var(--color-text);
		opacity: 0.7;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	.icon-button {
		background: var(--color-bg-1);
		color: var(--color-text);
		border: 1px solid var(--color-bg-2);
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 1.2rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
	}

	.icon-button :global(svg) {
		stroke-width: 1.5;
	}

	.icon-button.delete-button {
		background: #ef4444;
		color: white;
		border: none;
	}

	.icon-button.delete-button:hover {
		opacity: 0.9;
	}

	.calendar-header {
		margin-bottom: 1rem;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.nav-button {
		background: var(--color-bg-1);
		color: var(--color-text);
		border: 1px solid var(--color-bg-2);
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.nav-button:hover {
		background: var(--color-bg-2);
		border-color: var(--color-theme-1);
	}

	.calendar-header h3 {
		margin: 0;
		font-size: 1.2rem;
		color: var(--color-text);
	}

	.calendar-grid {
		background: var(--color-bg-1);
		border-radius: 8px;
		padding: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}

	.calendar-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
		margin-bottom: 0.25rem;
	}

	.weekday {
		text-align: center;
		font-weight: bold;
		color: var(--color-text);
		opacity: 0.7;
		font-size: 0.7rem;
		padding: 0.25rem;
	}

	.calendar-days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
	}

	.calendar-day {
		aspect-ratio: 1;
		padding: 0.25rem;
		background: var(--color-bg-2);
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		min-height: 40px;
		cursor: default;
		position: relative;
	}

	.calendar-day.has-activity {
		cursor: pointer;
	}

	.calendar-day.has-activity:hover {
		background: var(--color-bg-3);
	}

	.calendar-day.other-month {
		opacity: 0.3;
	}

	.day-number {
		font-size: 0.7rem;
		color: var(--color-text);
		opacity: 0.7;
		margin-bottom: 0.15rem;
	}

	.day-stats {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		width: 100%;
	}

	.circles-container {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.count-circle {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 0.9rem;
		font-weight: bold;
	}

	.count-circle.negative {
		background-color: #ef4444 !important;
	}

	.streak-indicator {
		font-size: 0.7rem;
		line-height: 1;
		margin-bottom: 0.15rem;
	}

	.day-value {
		font-size: 0.65rem;
		color: var(--color-text);
		opacity: 0.9;
		text-align: center;
		line-height: 1.2;
	}

	.day-value.positive {
		color: #22c55e;
	}

	.day-value.negative {
		color: #ef4444;
	}

	@media (min-width: 640px) {
		.calendar-grid {
			padding: 0.75rem;
		}

		.calendar-day {
			min-height: 80px;
		}

		.weekday {
			font-size: 0.9rem;
			padding: 0.5rem;
		}

		.day-number {
			font-size: 0.9rem;
		}

		.count-circle {
			width: 28px;
			height: 28px;
			font-size: 0.9rem;
		}

		.day-value {
			font-size: 0.85rem;
		}
	}

	@media (min-width: 1024px) {
		.calendar-grid {
			padding: 1rem;
		}

		.calendar-day {
			min-height: 100px;
		}

		.weekday {
			font-size: 1rem;
			padding: 0.75rem;
		}

		.day-number {
			font-size: 1rem;
		}

		.count-circle {
			width: 32px;
			height: 32px;
			font-size: 1rem;
		}

		.day-value {
			font-size: 0.9rem;
		}
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.view-switcher {
		display: flex;
		gap: 0.5rem;
	}

	.view-button {
		background: var(--color-bg-1);
		color: var(--color-text);
		border: 1px solid var(--color-bg-2);
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 1.2rem;
		cursor: pointer;
		transition: all 0.2s;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.view-button :global(svg) {
		stroke-width: 1.5;
	}

	.view-button.active {
		background: var(--color-theme-1);
		color: black;
		border-color: var(--color-theme-1);
	}

	.list-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.day-group {
		background: var(--color-bg-1);
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.day-header {
		background: var(--color-bg-2);
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.day-date {
		font-weight: bold;
		color: var(--color-text);
	}

	.day-total {
		font-weight: bold;
	}

	.day-total.positive {
		color: #22c55e;
	}

	.day-total.negative {
		color: #ef4444;
	}

	.transactions-list {
		padding: 0.5rem;
	}

	.transaction {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--color-bg-2);
		border-radius: 4px;
		margin: 0.5rem;
	}

	.chart-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-bg-1);
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.month-bar {
		display: grid;
		grid-template-columns: 150px 1fr 150px;
		gap: 1rem;
		align-items: center;
	}

	.month-label {
		font-weight: bold;
		color: var(--color-text);
	}

	.bar-container {
		height: 24px;
		background: var(--color-bg-2);
		border-radius: 12px;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		transition: width 0.3s ease;
	}

	.month-stats {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		align-items: center;
	}

	.month-activity {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.month-total {
		font-weight: bold;
	}

	.month-total.positive {
		color: #22c55e;
	}

	.month-total.negative {
		color: #ef4444;
	}

	.count-circle.negative {
		background-color: #ef4444 !important;
	}

	@media (max-width: 640px) {
		.month-bar {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.month-stats {
			justify-content: space-between;
		}
	}

	.day-header-right {
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
	}

	.total-flex {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.streak-flex {
		display: flex;
		align-items: center;
		gap: 0.25rem;
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


</style>

