import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail } from "./emailValidation.js";

test("normalizes valid addresses independent of letter case and whitespace", () => {
  assert.equal(normalizeEmail("  Student.Name+tag@GMAIL.COM "), "student.name+tag@gmail.com");
  assert.equal(normalizeEmail("Admin@Example.ORG"), "admin@example.org");
});

test("accepts valid addresses for common and custom mail providers", () => {
  assert.equal(normalizeEmail("person@gmail.com"), "person@gmail.com");
  assert.equal(normalizeEmail("person@outlook.com"), "person@outlook.com");
  assert.equal(normalizeEmail("person@university.edu.pk"), "person@university.edu.pk");
});

test("rejects malformed, incomplete, oversized, and non-string addresses", () => {
  for (const email of [
    "",
    "plain-address",
    "person@localhost",
    "person..name@example.com",
    ".person@example.com",
    "person@example..com",
    "person@-example.com",
    "person@example-.com",
    "person name@example.com",
    "a".repeat(65) + "@example.com",
    "a".repeat(250) + "@example.com",
    null,
    42,
  ]) {
    assert.equal(normalizeEmail(email), null, `expected invalid: ${String(email).slice(0, 40)}`);
  }
});
