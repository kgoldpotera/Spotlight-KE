// src/routes/api/contact/+server.ts
import type { RequestHandler } from './$types';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

function esc(s: string) {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

export const POST: RequestHandler = async ({ request }) => {
	const ct = request.headers.get('content-type') ?? '';
	let payload: Record<string, string> = {};
	if (ct.includes('form')) {
		const fd = await request.formData();
		if ((fd.get('company') as string)?.trim())
			return new Response(JSON.stringify({ ok: true }), { status: 200 });
		payload = {
			name: (fd.get('name') as string) ?? '',
			email: (fd.get('email') as string) ?? '',
			subject: (fd.get('subject') as string) ?? '',
			message: (fd.get('message') as string) ?? '',
			consent: (fd.get('consent') as string) ?? ''
		};
	} else {
		payload = (await request.json().catch(() => ({}))) as any;
	}

	const { name = '', email = '', subject = '', message = '', consent = '' } = payload;
	if (
		name.length < 2 ||
		!email.includes('@') ||
		!subject ||
		subject.length > 140 ||
		!message ||
		consent !== 'on'
	) {
		return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
	}

	const key = env.RESEND_API_KEY;
	const from = env.CONTACT_FROM;
	const to = (env.CONTACT_TO ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	// If not configured yet, don’t hard-fail during dev:
	if (!key || !from || !to.length) {
		console.log('[contact:dev-fallback]', {
			from,
			to,
			name,
			email,
			subject,
			snippet: message.slice(0, 120)
		});
		return new Response(JSON.stringify({ ok: true, note: 'Email not configured (dev fallback)' }), {
			status: 200
		});
	}

	const resend = new Resend(key);
	const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;">
      <h2>New Contact Request</h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      <p><strong>Subject:</strong> ${esc(subject)}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space: pre-wrap; background:#f6f6f6; padding:12px; border-radius:8px;">${esc(message)}</pre>
    </div>
  `;
	const text = `New Contact Request
Name: ${name}
Email: ${email}
Subject: ${subject}

${message}
`;

	await resend.emails.send({
		from,
		to,
		subject: `Contact • ${subject}`,
		html,
		text,
		reply_to: email
	});

	return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
