<script lang="ts">
  import Hero from '$lib/ui/Hero.svelte';
  import ArticleCard from '$lib/ui/ArticleCard.svelte';
  import AdCard from '$lib/ui/AdCard.svelte';
  // using 'any' here keeps the template simple
  export let data: { lead: any; rightRail: any[]; main: any[]; fetchedAt: number };
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
  <h1 class="text-3xl font-semibold tracking-tight">SPOTLIGHT-KE</h1>
  <p class="opacity-80 mt-1">Kenya’s news—fast, clean, and reliable.</p>

  <!-- Top row: 3/4 lead (Kenya) + 1/4 right rail -->
  <div class="mt-6 grid gap-6 lg:grid-cols-4">
    <div class="lg:col-span-3">
      {#if data.lead}
        <Hero item={data.lead} />
      {/if}
    </div>

    <aside class="lg:col-span-1 flex flex-col gap-4">
      {#each data.rightRail as item (item.id)}
        <ArticleCard {item} variant="compact" />
      {/each}
      <!-- Optional ad in the right rail -->
      <AdCard label="Sponsored" />
    </aside>
  </div>

  <!-- Main stream: remaining Kenya first, then Global, with ad slots -->
  <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each data.main as item (item.id ?? item.label)}
      {#if item.kind === 'ad'}
        <AdCard label={item.label ?? 'Sponsored'} />
      {:else}
        <ArticleCard item={item} />
      {/if}
    {/each}
  </div>
</section>
