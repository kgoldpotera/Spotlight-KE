<script lang="ts">
  let status: 'idle' | 'sending' | 'success' | 'error' = 'idle';
  let msg = '';

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    // honeypot
    if ((data.get('company') as string)?.trim()) {
      status = 'success'; msg = 'Thanks! We’ll be in touch.'; form.reset(); return;
    }

    status = 'sending'; msg = '';
    try {
      const r = await fetch('/api/contact', { method: 'POST', body: data });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body?.error || 'Failed to send');
      status = 'success';
      msg = 'Thanks! We’ve received your message.';
      form.reset();
    } catch (err: any) {
      status = 'error';
      msg = err?.message || 'Something went wrong.';
    }
  }
</script>

<footer class="mt-16 border-t" style="border-color: var(--border)">
  <div class="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-2">
    <section>
      <h2 class="text-lg font-semibold">About</h2>
      <p class="mt-2 text-sm opacity-80">
        SPOTLIGHT-KE aggregates Kenyan outlets and global briefs—fast, clean, reliable.
      </p>
    </section>

    <section>
      <h2 class="text-lg font-semibold">Contact us</h2>
      <form class="mt-3 grid gap-3" on:submit={onSubmit} novalidate>
        <!-- Honeypot -->
        <input type="text" name="company" autocomplete="organization" tabindex="-1" aria-hidden="true" class="hidden" />

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1" for="name">Full name</label>
            <input id="name" name="name" required minlength="2" maxlength="120"
              class="w-full rounded-xl border px-3 py-2"
              style="border-color: var(--border); background: var(--background-alt); color: var(--text-color)" />
          </div>
          <div>
            <label class="block text-sm mb-1" for="email">Email</label>
            <input id="email" name="email" type="email" required
              class="w-full rounded-xl border px-3 py-2"
              style="border-color: var(--border); background: var(--background-alt); color: var(--text-color)" />
          </div>
        </div>

        <div>
          <label class="block text-sm mb-1" for="subject">Subject</label>
          <input id="subject" name="subject" required maxlength="140"
            class="w-full rounded-xl border px-3 py-2"
            style="border-color: var(--border); background: var(--background-alt); color: var(--text-color)" />
        </div>

        <div>
          <label class="block text-sm mb-1" for="message">Message</label>
          <textarea id="message" name="message" required minlength="10" maxlength="4000" rows="5"
            class="w-full rounded-xl border px-3 py-2"
            style="border-color: var(--border); background: var(--background-alt); color: var(--text-color)"></textarea>
        </div>

        <div class="flex items-start gap-2">
          <input id="consent" name="consent" type="checkbox" required class="mt-1" />
          <label for="consent" class="text-sm opacity-90">I consent to be contacted regarding my inquiry.</label>
        </div>

        <div class="flex items-center gap-3">
          <button type="submit" class="rounded-xl border px-4 py-2 text-sm"
            disabled={status === 'sending'}
            style="border-color: var(--border); background: var(--background-alt); color: var(--text-color)">
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
          {#if status !== 'idle'}
            <p class="text-sm" aria-live="polite">{msg}</p>
          {/if}
        </div>
      </form>
    </section>
  </div>

  <div class="text-center text-xs py-4 opacity-60">
    © {new Date().getFullYear()} SPOTLIGHT-KE • All rights reserved.
  </div>
</footer>
