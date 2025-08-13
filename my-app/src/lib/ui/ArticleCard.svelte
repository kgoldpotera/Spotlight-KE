<script lang="ts">
  export let item: any;
</script>

<a class="block rounded-xl border p-4 no-underline hover:opacity-90 transition"
   style="border-color: var(--border); background: var(--background-alt)"
   href={item.url} rel="noopener noreferrer" target="_blank">
  <div class="text-sm opacity-70">{item.source}</div>
  <div class="mt-1 font-medium">{item.title}</div>
</a>
