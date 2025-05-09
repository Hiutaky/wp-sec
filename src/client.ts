import { treaty } from "@elysiajs/eden"
import type { App } from "./server"
import { env } from "bun";
export const api = treaty<App>(
    env.NODE_ENV === "production" ? 
        env.PUBLIC_URL
    :'localhost:3000'
);
export type Outputs = typeof api;

export type ScanResponse = Awaited<ReturnType<Outputs['scan']['post']>>['data'];
