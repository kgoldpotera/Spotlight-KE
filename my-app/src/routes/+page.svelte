<script lang="ts">
  import Hero from '$lib/ui/Hero.svelte';
  import ArticleCard from '$lib/ui/ArticleCard.svelte';
  import type { Article } from '$lib/types';

  type Kind = 'rss' | 'x';
  type A = Article & { origin?: Kind };

  // from +page.server.ts
  export let data: {
    lead?: A;
    rightRail: A[];
    main: A[];
    fetchedAt: number;
  };
</script>

<section class="container">
  <!-- ABOVE THE FOLD -->
  <div class="above-fold">
    {#if data.lead}
      <Hero item={data.lead} />
    {/if}

    <aside class="rail">
      {#each data.rightRail as it (it.url)}
        <ArticleCard item={it} variant="rail" />
      {/each}

      <!-- Ad slot (keep as a link, but give it a valid URL to satisfy a11y) -->
      <a class="ad-card" href="/sponsored" rel="nofollow noopener" aria-label="Sponsored">
        <small>Sponsored — 300×250 / responsive</small>
      </a>
    </aside>
  </div>

  <!-- MAIN STREAM -->
  <div class="cards-grid">
    {#each data.main as item (item.url)}
      <ArticleCard item={item} />
    {/each}
  </div>
</section>

<style>
  .container { max-width: 1120px; margin: 0 auto; padding: 24px; }

  .above-fold {
    display: grid;
    grid-template-columns: 2fr 1fr; /* big hero left, rail right */
    gap: 24px;
    align-items: start;
  }

  .rail { display: grid; gap: 12px; }

  .ad-card {
    display: grid; place-items: center;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    text-decoration: none;
    color: inherit;
    background: var(--background-alt);
    opacity: .9;
  }
  .ad-card:hover { opacity: 1; }

  .cards-grid {
    margin-top: 28px;
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 980px) {
    .above-fold { grid-template-columns: 1fr; }
    .cards-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 620px) {
    .cards-grid { grid-template-columns: 1fr; }
  }
</style>
