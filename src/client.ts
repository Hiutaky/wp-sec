import { treaty } from "@elysiajs/eden"
import type { App } from "./server"
export const api = treaty<App>('localhost:3000');

export type Outputs = typeof api;

export type ScanResponse = Awaited<ReturnType<Outputs['scan']['post']>>['data'];
