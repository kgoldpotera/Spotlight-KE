<script lang="ts">
  import type { Article } from '$lib/types';

  export let item: Article;
  export let variant: 'default' | 'rail' = 'default';
</script>

<a class={`card ${variant === 'rail' ? 'card--rail' : ''}`}
   href={item.url} target="_blank" rel="noopener noreferrer">
  {#if variant === 'rail'}
    <div class="thumb">
      {#if item.image}
        <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
      {:else}
        <div class="ph"></div>
      {/if}
    </div>
    <div class="body">
      <div class="kicker">{item.sourceName ?? item.source}</div>
      <div class="title line-3">{item.title}</div>
    </div>
  {:else}
    <div class="media">
      {#if item.image}
        <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
      {:else}
        <div class="ph"></div>
      {/if}
    </div>
    <div class="pad">
      <div class="kicker">{item.sourceName ?? item.source}</div>
      <div class="title">{item.title}</div>
      {#if item.excerpt}
        <p class="dek line-3">{item.excerpt}</p>
      {/if}
    </div>
  {/if}
</a>

<style>
  .card {
    position: relative;
    display: block;
    border: 1px solid var(--border);
    background: var(--background-alt);
    text-decoration: none;
    color: inherit;
    border-radius: 12px;
    overflow: hidden;
    transition: transform .12s ease, opacity .12s ease;
  }
  .card:hover { transform: translateY(-1px); opacity: .98; }

  /* default card */
  .media { aspect-ratio: 16/9; overflow: hidden; }
  .media > img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .media .ph { width: 100%; height: 100%; background: #2f2a29; }
  .pad { padding: 12px 14px 14px; }

  .kicker { font-size: 12px; opacity: .7; margin-bottom: 6px; color: #f2c078; }
  .title  { font-weight: 600; line-height: 1.25; }
  .dek    { margin: 8px 0 0 0; opacity: .85; }

  /* rail variant (thumb left, text right) */
  .card--rail {
    display: grid; grid-template-columns: 112px 1fr; gap: 12px; padding: 10px;
  }
  .card--rail .thumb { aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
  .card--rail .thumb > img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card--rail .thumb .ph { width: 100%; height: 100%; background: #2f2a29; }
  .card--rail .body .kicker { margin: 1px 0 6px; }
  .card--rail .body .title { font-size: 14px; }

  /* simple line clamp (no Tailwind) */
  .line-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;       /* WebKit */
    line-clamp: 3;               /* Standard */
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
