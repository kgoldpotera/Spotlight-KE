<script lang="ts">
  export let item: any;
</script>

<a class="block rounded-xl border no-underline hover:opacity-90 transition overflow-hidden"
   style="border-color: var(--border); background: var(--background-alt)"
   href={item.url} rel="noopener noreferrer" target="_blank">
  <div style="aspect-ratio: 16 / 9;" class="w-full overflow-hidden">
    {#if item.image}
      <img
        src={item.image}
        alt={item.title}
        loading="lazy"
        decoding="async"
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
</a>
