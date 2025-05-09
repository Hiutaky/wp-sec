declare module "bun" {
    interface Env {
      PUBLIC_URL: string;
      NODE_ENV: string;
    }
}