<script lang="ts">
  export let item: any;
  export let variant: 'default' | 'compact' = 'default';
</script>

<a class="block rounded-xl border no-underline hover:opacity-90 transition overflow-hidden"
   style="border-color: var(--border); background: var(--background-alt)"
   href={item.url} rel="noopener noreferrer" target="_blank">

  {#if variant === 'default'}
    <div style="aspect-ratio: 16 / 9;" class="w-full overflow-hidden">
      {#if item.image}
        <img src={item.image} alt={item.title} loading="lazy" decoding="async"
             class="w-full h-full object-cover"
             sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw" />
      {:else}
        <div class="w-full h-full opacity-10" style="background: var(--text-color)"></div>
      {/if}
    </div>
    <div class="p-4">
      <div class="text-xs opacity-70">{item.source}</div>
      <div class="mt-1 font-medium">{item.title}</div>
      {#if item.excerpt}<p class="mt-2 text-sm opacity-80 line-clamp-3">{item.excerpt}</p>{/if}
    </div>
  {:else}
    <!-- compact: tighter padding, smaller text -->
    <div class="grid grid-cols-[112px_1fr] gap-3 p-3">
      <div class="rounded overflow-hidden border" style="border-color: var(--border)">
        <div style="aspect-ratio: 16/9;" class="w-full h-full">
          {#if item.image}
            <img src={item.image} alt={item.title} loading="lazy" decoding="async"
                 class="w-full h-full object-cover" />
          {:else}
            <div class="w-full h-full opacity-10" style="background: var(--text-color)"></div>
          {/if}
        </div>
      </div>
      <div class="min-w-0">
        
        <div class="mt-0.5 text-sm font-medium line-clamp-3">{item.title}</div>
        <div class="text-xs opacity-70">{item.sourceName ?? item.source}</div>

      </div>
    </div>
  {/if}
</a>
