export function summarize(text: string, maxChars = 240): string {
	const t = text.trim().replace(/\s+/g, ' ');
	if (t.length <= maxChars) return t;
	// cut at last period before max if possible
	const cut = t.slice(0, maxChars);
	const i = cut.lastIndexOf('.');
	return (i > 80 ? cut.slice(0, i + 1) : cut) + '…';
}
