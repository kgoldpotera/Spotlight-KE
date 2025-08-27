<script lang="ts">
  import { page } from '$app/stores';

  // Edit your nav here
  const links = [
    { href: '/business', label: 'Business' },
    { href: '/tech',     label: 'Tech' },
    { href: '/sports',   label: 'Sports' },
    { href: '/admin',    label: 'Admin' }
  ];

  let isLight = true;
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    isLight = next === 'light';
  }

  $: current = $page.url.pathname;
</script>

<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/">SPOTLIGHT-KE</a>

    <nav class="nav">
      {#each links as l}
        <a
          class="nav-link {current.startsWith(l.href) ? 'active' : ''}"
          href={l.href}
        >{l.label}</a>
      {/each}

      <button class="theme" on:click={toggleTheme}>
        {#if isLight}☀ Light{/if}{#if !isLight}🌙 Dark{/if}
      </button>
    </nav>
  </div>
</header>

<style>
  .site-header {
    position: sticky; top: 0; z-index: 50;
    background: var(--bistre);
    color: #fff;
    border-bottom: 1px solid rgba(255,255,255,.06);
    box-shadow: 0 1px 0 rgba(0,0,0,.04);
  }
  .header-inner {
    display: flex; align-items: center; justify-content: space-between;
    padding: .75rem 1rem;
  }
  .brand {
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: .02em;
    color: var(--sunset);
    text-decoration: none;
  }
  .brand:hover { opacity: .9; }

  .nav { display: flex; align-items: center; gap: .25rem; }
  .nav-link {
    padding: .4rem .6rem;
    border-radius: .5rem;
    color: rgba(255,255,255,.88);
    font-weight: 600;
    text-decoration: none;
    transition: background .15s ease, color .15s ease, box-shadow .15s ease;
  }
  .nav-link:hover {
    background: rgba(242,200,121,.12);
    color: var(--sunset);
  }
  .nav-link.active {
    color: var(--sunset);
    background: rgba(242,200,121,.10);
    box-shadow: inset 0 -2px 0 0 var(--sunset);
  }

  .theme {
    margin-left: .35rem;
    border: 0; cursor: pointer;
    padding: .42rem .6rem; border-radius: .5rem;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, var(--madder), #921627);
    box-shadow: 0 1px 1px rgba(0,0,0,.2), inset 0 0 0 1px rgba(255,255,255,.08);
    transition: filter .15s ease, transform .02s ease-in-out;
  }
  .theme:hover { filter: brightness(1.05); }
  .theme:active { transform: translateY(1px); }

  @media (min-width: 768px) {
    .header-inner { padding: .9rem 1rem; }
    .brand { font-size: 1.35rem; }
  }
</style>
