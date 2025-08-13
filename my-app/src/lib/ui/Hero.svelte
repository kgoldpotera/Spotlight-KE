<script lang="ts">
  export let item: any = null;
</script>

{#if item}
  <a class="block rounded-2xl border p-6 no-underline"
     style="border-color: var(--border); background: var(--background-alt)"
     href={item.url} rel="noopener noreferrer" target="_blank">
    <h2 class="text-2xl font-semibold">{item.title}</h2>
    {#if item.excerpt}<p class="mt-2 opacity-80">{item.excerpt}</p>{/if}
  </a>
{/if}
