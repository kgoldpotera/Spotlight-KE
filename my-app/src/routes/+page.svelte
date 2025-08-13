<script lang="ts">
  import Hero from '$lib/ui/Hero.svelte';
  import ArticleCard from '$lib/ui/ArticleCard.svelte';
  export let data: { hero: any; items: any[]; fetchedAt: number };
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
  <h1 class="text-3xl font-semibold tracking-tight">SPOTLIGHT-KE</h1>
  <p class="opacity-80 mt-1">Kenya’s news—fast, clean, and reliable.</p>

  {#if data.hero}
    <div class="mt-6">
      <Hero item={data.hero} />
    </div>
  {/if}

  <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each data.items as item (item.id)}
      <ArticleCard {item} />
    {/each}
  </div>
</section>
