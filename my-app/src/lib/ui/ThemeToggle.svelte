<script lang="ts">
  import { onMount } from 'svelte';

  let theme: 'light'|'dark' = 'light';

  function apply(t: 'light'|'dark') {
    theme = t;
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    localStorage.setItem('theme', t);
  }

  function toggle() { apply(theme === 'light' ? 'dark' : 'light'); }

  onMount(() => {
    const saved = (localStorage.getItem('theme') as 'light'|'dark' | null) || 'light';
    apply(saved);
  });
</script>

<button
  class="rounded-xl border px-3 py-1 text-sm"
  style="border-color: var(--border); background: var(--background-alt); color: var(--text-color)"
  on:click={toggle}
  aria-pressed={theme === 'dark'}
  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
  {theme === 'dark' ? '☾ Dark' : '☀︎ Light'}
</button>
