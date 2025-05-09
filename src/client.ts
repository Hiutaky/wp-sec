import { treaty } from "@elysiajs/eden"
import type { App } from "./server"
console.log(
    import.meta.env.VITE_PUBLIC_URL!);
export const api = treaty<App>(
    import.meta.env.VITE_PUBLIC_URL!
);

export type Outputs = typeof api;

export type ScanResponse = Awaited<ReturnType<Outputs['scan']['post']>>['data'];
