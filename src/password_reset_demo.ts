import { InfraiClient, requestPropertyPasswordReset } from "./password_reset_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the demo");

const client = new InfraiClient(key);
const result = await requestPropertyPasswordReset(
  client,
  { email: process.env.RESET_EMAIL ?? "tenant@example.com" },
  "https://property.example/reset/demo-token",
);
console.log(JSON.stringify(result, null, 2));
