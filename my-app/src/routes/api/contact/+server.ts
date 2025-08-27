import type { RequestHandler } from './$types';
import { RESEND_API_KEY, CONTACT_FROM, CONTACT_TO, PUBLIC_APP_NAME } from '$env/static/private';

// Lightweight email validator
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();

	// Honeypot (if filled, silently succeed)
	const company = (form.get('company') as string | null)?.trim() ?? '';
	if (company) {
		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}

	const name = (form.get('name') as string | null)?.trim() ?? '';
	const email = (form.get('email') as string | null)?.trim() ?? '';
	const subject = (form.get('subject') as string | null)?.trim() ?? '';
	const message = (form.get('message') as string | null)?.trim() ?? '';
	const consent = (form.get('consent') as string | null) !== null;

	// Basic validation (mirror your form constraints)
	if (name.length < 2 || name.length > 120) return jsonBad('Please enter your full name.');
	if (!emailRx.test(email)) return jsonBad('Please enter a valid email address.');
	if (!subject || subject.length > 140) return jsonBad('Please enter a subject (≤ 140 chars).');
	if (!message || message.length < 10) return jsonBad('Please write a message (≥ 10 chars).');
	if (!consent) return jsonBad('Consent is required.');

	// Build email
	const app = PUBLIC_APP_NAME || 'SPOTLIGHT-KE';
	const from = CONTACT_FROM || 'onboarding@resend.dev'; // fallback for dev/testing
	const to = CONTACT_TO || 'koechmanoah32@gmail.com';

	const html = `
		<h2>New contact from ${app}</h2>
		<p><strong>Name:</strong> ${escapeHtml(name)}</p>
		<p><strong>Email:</strong> ${escapeHtml(email)}</p>
		<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
		<p><strong>Consent:</strong> ${consent ? 'Yes' : 'No'}</p>
		<hr />
		<pre style="white-space:pre-wrap;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
${escapeHtml(message)}
		</pre>
	`;

	const payload = {
		from,
		to,
		reply_to: email,
		subject: `[${app}] ${subject}`,
		text: `New contact on ${app}

Name: ${name}
Email: ${email}
Subject: ${subject}
Consent: ${consent ? 'Yes' : 'No'}

${message}
`,
		html
	};

	// Send via Resend HTTP API
	const r = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	if (!r.ok) {
		const err = await r.json().catch(() => ({}));
		return new Response(JSON.stringify({ error: err?.message || 'Send failed' }), {
			status: 500,
			headers: { 'content-type': 'application/json' }
		});
	}

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};

// Helpers
function jsonBad(msg: string) {
	return new Response(JSON.stringify({ error: msg }), {
		status: 400,
		headers: { 'content-type': 'application/json' }
	});
}

function escapeHtml(s: string) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
