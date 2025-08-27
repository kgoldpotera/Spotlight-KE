// src/app.d.ts
// Make this file a module.
export {};

declare global {
	namespace App {
		interface Locals {
			flags?: {
				enableX?: boolean;
			};
		}
	}
}
