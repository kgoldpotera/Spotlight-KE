<script lang="ts">
  export let item: any = null;
</script>

{#if item}
  <a class="block rounded-2xl border no-underline overflow-hidden"
     style="border-color: var(--border); background: var(--background-alt)"
     href={item.url} rel="noopener noreferrer" target="_blank">
    {#if item.image}
      <div style="aspect-ratio: 16 / 9;" class="w-full overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          loading="eager"
          decoding="async"
          class="w-full h-full object-cover"
          sizes="(min-width: 1024px) 960px, 100vw" />
      </div>
    {/if}
    <div class="p-6">
      <h2 class="text-3xl font-semibold">{item.title}</h2>
      {#if item.excerpt}<p class="mt-2 opacity-80">{item.excerpt}</p>{/if}
      <div class="text-xs opacity-70">{item.sourceName ?? item.source}</div>

    </div>
    
  </a>
{/if}
