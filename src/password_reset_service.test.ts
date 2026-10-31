import test from "node:test";
import assert from "node:assert/strict";
import { decideResetRequest } from "./password_reset_service.ts";

test("a malformed tenant email is rejected before any reset request", () => {
  assert.deepEqual(decideResetRequest({ email: "unit-12" }), { accepted: false, reason: "invalid_email" });
  assert.deepEqual(decideResetRequest({ email: "tenant@example.com" }), { accepted: true, email: "tenant@example.com" });
});
