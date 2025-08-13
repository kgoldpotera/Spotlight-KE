import type { Category } from '$lib/types';

const rules: Array<{ re: RegExp; cat: Category }> = [
	{
		re: /\b(kenya|state house|nairobi|ruto|azimio|uda|parliament|cabinet|senate|election)\b/i,
		cat: 'Politics'
	},
	{
		re: /\b(economy|market|shilling|bank|kcb|equity|safaricom|trade|business)\b/i,
		cat: 'Business'
	},
	{ re: /\b(football|fkf|afcon|rugby|athletics|marathon|league|sports?)\b/i, cat: 'Sports' },
	{ re: /\b(tech|startup|ai|software|app|data|fiber|spectrum|4g|5g)\b/i, cat: 'Tech' },
	{ re: /\b(health|hospital|clinic|covid|malaria|nhif|uha?c|immuni[sz]ation)\b/i, cat: 'Health' },
	{
		re: /\b(entertainment|music|film|celebrity|show|culture|festival|theatre)\b/i,
		cat: 'Entertainment'
	}
];

export function classifyCategory(input: string): Category | null {
	for (const { re, cat } of rules) {
		if (re.test(input)) return cat;
	}
	return null;
}
