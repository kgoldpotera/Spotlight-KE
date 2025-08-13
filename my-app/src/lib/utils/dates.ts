export function toISO(d: string | number | Date): string {
	try {
		const dt = new Date(d);
		if (Number.isNaN(dt.getTime())) return new Date().toISOString();
		return dt.toISOString();
	} catch {
		return new Date().toISOString();
	}
}
