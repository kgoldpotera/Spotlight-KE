<script lang="ts">
  import ArticleCard from '$lib/ui/ArticleCard.svelte';
  export let data: { category: string | null; items: any[]; page: number; size: number };
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
  <h1 class="text-2xl font-semibold">{data.category ?? 'Unknown section'}</h1>
  <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each data.items as item (item.id)}
      <ArticleCard {item} />
    {/each}
  </div>
</section>
