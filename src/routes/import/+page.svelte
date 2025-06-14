<script lang="ts">
	import { onMount } from 'svelte';
	import { habits } from '$lib/stores/habits';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	let error: string | null = null;
	let success = false;
	let habitsInput = '';
	let isValidJson = false;
	let formattedJson = '';
	let highlightedJson = '';

	function formatJson() {
		try {
			const parsed = JSON.parse(habitsInput);
			habitsInput = JSON.stringify(parsed, null, 2);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Invalid JSON format';
		}
	}

	function highlightJson(json: string): string {
		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
			let cls = 'number';
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = 'key';
				} else {
					cls = 'string';
				}
			} else if (/true|false/.test(match)) {
				cls = 'boolean';
			} else if (/null/.test(match)) {
				cls = 'null';
			}
			return '<span class="' + cls + '">' + match + '</span>';
		});
	}

	$: {
		try {
			if (habitsInput.trim()) {
				const parsed = JSON.parse(habitsInput);
				formattedJson = JSON.stringify(parsed, null, 2);
				highlightedJson = highlightJson(formattedJson);
				isValidJson = true;
				error = null;
			} else {
				isValidJson = false;
				formattedJson = '';
				highlightedJson = '';
			}
		} catch (e) {
			isValidJson = false;
			formattedJson = '';
			highlightedJson = '';
			error = e instanceof Error ? e.message : 'Invalid JSON format';
		}
	}

	function handleImport() {
		try {
			const importedHabits = JSON.parse(habitsInput);
			
			// Validate the imported data
			if (!Array.isArray(importedHabits)) {
				throw new Error('Oops! That doesn\'t look like valid kitty habits data. Please check the format and try again.');
			}

			// Update the store and localStorage
			habits.set(importedHabits);
			localStorage.setItem('habits', JSON.stringify(importedHabits));
			
			success = true;
			
			// Redirect to home page after 2 seconds
			setTimeout(() => {
				goto('/');
			}, 2000);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Meow! Something went wrong while importing your kitty habits.';
		}
	}
</script>

<div class="container">
	<nav class="breadcrumb">
		<a href="/">← Back Home</a>
	</nav>
	<div class="import-status">
		{#if error}
			<div class="error">
				<h2>Import Failed</h2>
				<p>{error}</p>
			</div>
		{:else if success}
			<div class="success">
				<h2>Import Successful!</h2>
				<p>Your kitties have been purr-fectly imported!</p>
				<p>Taking you back to your dashboard...</p>
			</div>
		{:else}
			<div class="import-form">
				<pre class="ascii-cat">
./\___/\.
(≥ • - • ≤)
   (  v  v   )~~~</pre>
				<div class="input-container">
					{#if isValidJson}
						<div class="editor-container">
							<div class="json-editor" contenteditable="true" bind:textContent={habitsInput}>
								{@html highlightedJson}
							</div>
							<button class="format-button" on:click={formatJson} title="Format JSON">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
									<path d="M18 14h-8"/>
									<path d="M18 18h-8"/>
									<path d="M18 10h-8"/>
								</svg>
								Format
							</button>
						</div>
					{:else}
						<textarea
							bind:value={habitsInput}
							placeholder="Paste your kitty data here..."
							rows="10"
							class:error={error}
						></textarea>
					{/if}
				</div>
				<div class="button-group">
					<button on:click={handleImport} class="button" disabled={!isValidJson}>Import</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
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

	.import-status {
		background: var(--color-bg-1);
		padding: 2rem;
		border-radius: 12px;
		border: 1px solid var(--color-bg-2);
		text-align: center;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.import-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
	}

	textarea {
		width: 100%;
		padding: 1rem;
		border: 2px solid var(--color-bg-2);
		border-radius: 8px;
		background: var(--color-bg-2);
		color: var(--color-text);
		font-family: monospace;
		resize: vertical;
		transition: border-color 0.2s;
	}

	textarea.error {
		border-color: #ff4444;
	}

	textarea:focus {
		outline: none;
		border-color: var(--color-theme-1);
	}

	h2 {
		margin: 0 0 1rem;
		color: var(--color-text);
		font-size: 1.75rem;
		font-weight: 600;
	}

	p {
		margin: 0 0 1.5rem;
		color: var(--color-text);
		opacity: 0.8;
		line-height: 1.5;
	}

	.error {
		color: #ff4444;
	}

	.success {
		color: #4CAF50;
	}

	.button {
		display: inline-block;
		background: var(--color-theme-1);
		color: black;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s;
	}

	.button:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.ascii-cat {
		font-family: monospace;
		white-space: pre;
		text-align: center;
		margin: 0;
		color: var(--color-text);
		font-size: 1.2rem;
		line-height: 1.2;
		background: transparent;
		box-shadow: none;
	}

	.button-group {
		display: flex;
		justify-content: flex-end;
		width: 100%;
		max-width: 600px;
	}

	.input-container {
		width: 100%;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.editor-container {
		width: 100%;
		position: relative;
	}

	.format-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-bg-1);
		border: 1px solid var(--color-bg-3);
		border-radius: 4px;
		color: var(--color-text);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
		z-index: 1;
		opacity: 0.8;
	}

	.format-button:hover {
		opacity: 1;
		background: var(--color-bg-2);
	}

	.format-button svg {
		opacity: 0.8;
	}

	.json-editor {
		width: 100%;
		height: 300px;
		padding: 1rem;
		border: 2px solid var(--color-bg-2);
		border-radius: 8px;
		background: var(--color-bg-2);
		color: var(--color-text);
		font-family: 'Fira Code', 'Consolas', monospace;
		font-size: 0.9rem;
		line-height: 1.5;
		white-space: pre;
		overflow: auto;
		tab-size: 2;
		outline: none;
		text-align: left;
	}

	.json-editor > * {
		text-align: left;
	}

	.json-editor:focus {
		border-color: var(--color-theme-1);
	}

	/* JSON Syntax Highlighting */
	.json-editor :global(.string) { color: #a8ff60; }
	.json-editor :global(.number) { color: #ff9d00; }
	.json-editor :global(.boolean) { color: #ff628c; }
	.json-editor :global(.null) { color: #ff628c; }
	.json-editor :global(.key) { color: #5ccfe6; }

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style> 