<script lang="ts">
  import type { Article } from '$lib/types';
  export let item: Article;
</script>

<a class="hero-card" href={item.url} target="_blank" rel="noopener noreferrer">
  <!-- Image on top -->
  <figure class="hero-card__figure">
    {#if item.image}
      <img
        class="hero-card__img"
        src={item.image}
        alt={item.title}
        loading="eager"
        decoding="async"
      />
    {:else}
      <div class="hero-card__img hero-card__img--ph" aria-hidden="true"></div>
    {/if}
  </figure>

  <!-- Text under the image -->
  <div class="hero-card__body">
    <div class="hero-card__kicker">{item.sourceName ?? item.source}</div>
    <h2 class="hero-card__title">{item.title}</h2>
    {#if item.excerpt}
      <p class="hero-card__dek">{item.excerpt}</p>
    {/if}
  </div>
</a>

<style>
  .hero-card {
    display: block;
    text-decoration: none;
    color: inherit;

    background: var(--background-alt);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;

    transition: transform .12s ease, opacity .12s ease;
  }
  .hero-card:hover { opacity: .94; }

  .hero-card__figure { aspect-ratio: 16 / 9; background: #000; }
  .hero-card__img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }
  .hero-card__img--ph { background: #333; opacity: .25; }

  .hero-card__body { padding: 16px 16px 18px; }

  .hero-card__kicker {
    font-size: 12px;
    margin: 0 0 6px;
    opacity: .9;
    color: #ffd9a3; /* warm highlight from your palette */
  }

  /* Bigger than regular cards so it still feels like the “lead” */
  .hero-card__title {
    margin: 0 0 10px;
    font-weight: 800;
    line-height: 1.15;
    font-size: clamp(22px, 2.6vw, 34px);
    text-wrap: balance;
  }

  .hero-card__dek {
    margin: 0;
    opacity: .9;
    font-size: clamp(14px, 1.4vw, 16px);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;   /* WebKit */
    line-clamp: 3;           /* Standard */
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
