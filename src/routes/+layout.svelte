<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();

	// Function to register the service worker
	const registerServiceWorker = () => {
		if ('serviceWorker' in navigator) {
			window.addEventListener('load', () => {
				navigator.serviceWorker.register('/sw.js')
					.then(registration => {
						console.log('ServiceWorker registration successful:', registration);
					})
					.catch(err => {
						console.log('ServiceWorker registration failed:', err);
					});
			});
		}
	};

	// Call the function to register the service worker
	registerServiceWorker();
</script>

<div class="app">
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
