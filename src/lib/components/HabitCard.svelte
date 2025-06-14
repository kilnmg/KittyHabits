<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Habit } from '$lib/types';
  import AsciiCat from './AsciiCat.svelte';

  export let habit: Habit;

  function handleClick() {
    goto(`/habit/${habit.id}`);
  }
</script>

<div class="habit-card" on:click={handleClick}>
  <div class="habit-content">
    <h3>{habit.name}</h3>
    <AsciiCat value={habit.value} name={habit.name} step={habit.step || 10} />
    <p class="value">Value: {habit.value}</p>
  </div>
</div>

<style>
  .habit-card {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .habit-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .habit-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  h3 {
    margin: 0;
    color: #333;
    font-size: 1.2rem;
  }

  .value {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
</style> 