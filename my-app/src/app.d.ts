// See https://kit.svelte.dev/docs/types#app
declare global {
	namespace App {
		interface Locals {
			flags: { enableX: boolean; enableOG: boolean };
		}
		// interface Error {}
		// interface PageData {}
		// interface Platform {}
	}
}
export {};
