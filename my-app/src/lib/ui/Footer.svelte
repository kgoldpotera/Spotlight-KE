<script lang="ts">
  import { tick } from 'svelte';

  let open = false;
  let status: 'idle' | 'sending' | 'success' | 'error' = 'idle';
  let msg = '';

  let firstField: HTMLInputElement | null = null;

  async function openForm(e?: Event) {
    e?.preventDefault();
    open = true;
    await tick();
    firstField?.focus();
  }
  function closeForm() {
    open = false;
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    // honeypot
    if ((data.get('company') as string)?.trim()) {
      status = 'success';
      msg = 'Thanks! We’ll be in touch.';
      form.reset();
      return;
    }

    status = 'sending';
    msg = '';
    try {
      const r = await fetch('/api/contact', { method: 'POST', body: data });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body?.error || 'Failed to send');
      status = 'success';
      msg = 'Thanks! We’ve received your message.';
      form.reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      status = 'error';
      msg = message;
    }
  }

  function overlayKey(e: KeyboardEvent) {
    // Close on Escape, Enter, or Space when overlay has focus
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeForm();
    }
  }
</script>

<footer class="footer">
  <div class="bar">
    <section class="about">
      <p class="muted">
        <strong>About.</strong> SPOTLIGHT-KE aggregates Kenyan outlets and global briefs—fast, clean,
        reliable.
      </p>
    </section>

    <section class="contact">
      <p class="muted">
        Questions, feedback, or partnership inquiries?
        <button
          class="link"
          type="button"
          on:click={openForm}
          aria-haspopup="dialog"
          aria-controls="contact-dialog"
        >
          Contact us
        </button>.
      </p>
    </section>
  </div>

  <div class="copy">© {new Date().getFullYear()} SPOTLIGHT-KE • All rights reserved.</div>

  {#if open}
    <!-- Dim overlay (now keyboard accessible) -->
    <div
      class="overlay"
      role="button"
      tabindex="0"
      aria-label="Close contact dialog"
      on:click|self={closeForm}
      on:keydown={overlayKey}
    ></div>

    <!-- Centered modal -->
    <div class="modal">
      <div
        id="contact-dialog"
        class="card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
      >
        <header class="card__head">
          <h3 id="contact-title">Contact us</h3>
          <button class="icon" on:click={closeForm} aria-label="Close">✕</button>
        </header>

        <form class="form" on:submit={onSubmit} novalidate>
          <!-- Honeypot -->
          <input
            type="text"
            name="company"
            autocomplete="organization"
            tabindex="-1"
            aria-hidden="true"
            class="hp"
          />

          <div class="row">
            <div class="field">
              <label for="name">Full name</label>
              <input id="name" name="name" required minlength="2" maxlength="120" bind:this={firstField} />
            </div>
            <div class="field">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
          </div>

          <div class="field">
            <label for="subject">Subject</label>
            <input id="subject" name="subject" required maxlength="140" />
          </div>

          <div class="field">
            <label for="message">Message</label>
            <textarea id="message" name="message" required minlength="10" maxlength="4000" rows="5"></textarea>
          </div>

          <div class="check">
            <input id="consent" name="consent" type="checkbox" required />
            <label for="consent">I consent to be contacted regarding my inquiry.</label>
          </div>

          <div class="actions">
            <button type="submit" class="btn" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            <button type="button" class="btn btn--ghost" on:click={closeForm}>Cancel</button>
            {#if status !== 'idle'}
              <p class="status" aria-live="polite">{msg}</p>
            {/if}
          </div>
        </form>
      </div>
    </div>
  {/if}
</footer>

<style>
  .footer {
    margin-top: 40px;
    border-top: 1px solid var(--border);
    background: var(--background);
    color: var(--text-color);
  }

  .bar {
    max-width: 1120px;
    margin: 0 auto;
    padding: 18px 24px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media (max-width: 820px) {
    .bar { grid-template-columns: 1fr; gap: 12px; }
  }

  .muted { opacity: .8; margin: 0; font-size: 14px; line-height: 1.5; }

  /* “Contact us” as text link with hover */
  .link {
    background: none;
    border: none;
    padding: 0;
    margin-left: 4px;
    color: #f2c078;           /* sunset highlight */
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
  }
  .link:hover { text-decoration: underline; filter: brightness(1.05); }

  .copy {
    text-align: center;
    font-size: 12px;
    opacity: .6;
    padding: 8px 0 16px;
  }

  /* Modal */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.45);
    backdrop-filter: blur(1.5px);
  }
  .modal {
    position: fixed; inset: 0;
    display: grid; place-items: center;
    padding: 16px;
  }

  /* single card (no seam/gap) */
  .card {
    width: min(640px, 100%);
    background: var(--background-alt);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,.35);
    overflow: hidden;
  }
  .card__head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }
  .card__head h3 { margin: 0; font-size: 16px; }
  .icon { border: none; background: transparent; color: inherit; cursor: pointer; font-size: 18px; }

  .form { padding: 14px; }

  .hp { position: absolute; left: -10000px; opacity: 0; pointer-events: none; }

  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 640px) { .row { grid-template-columns: 1fr; } }

  .field label { display: block; font-size: 12px; margin-bottom: 6px; opacity: .85; }
  .field input, .field textarea {
    width: 100%;
    border: 1px solid var(--border);
    background: var(--background);
    color: var(--text-color);
    border-radius: 10px;
    padding: 10px 12px;
  }

  .check {
    display: grid; grid-template-columns: 18px 1fr;
    gap: 8px; align-items: start; margin-top: 6px;
  }
  .check input { margin-top: 2px; }

  .actions { display: flex; align-items: center; gap: 10px; margin-top: 12px; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--background-alt);
    color: var(--text-color);
    font-weight: 700;
    cursor: pointer;
  }
  .btn:hover { filter: brightness(1.02); }
  .btn:disabled { opacity: .6; cursor: not-allowed; }
  .btn--ghost { background: transparent; }

  .status { font-size: 13px; }
</style>
