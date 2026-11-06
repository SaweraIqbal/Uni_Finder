import test from "node:test";
import assert from "node:assert/strict";
import { cleanupUnverifiedAccounts } from "./cleanupUnverifiedAccounts.js";

test("removes expired unverified signups in bounded batches and clears expired/orphan tokens", async () => {
  const affectedRows = [500, 2, 0];
  const statements = [];
  const db = {
    query(sql, callback) {
      statements.push(sql);
      callback(null, { affectedRows: affectedRows.shift() });
    },
  };

  const deletedCount = await cleanupUnverifiedAccounts(db);

  assert.equal(deletedCount, 502);
  assert.equal(statements.length, 3);
  assert.match(statements[0], /email_verified = 0/);
  assert.match(statements[0], /email_verification_expires_at <= NOW\(\)/);
  assert.match(statements[0], /LIMIT 500/);
  assert.match(statements[2], /expires_at <= NOW\(\)/);
  assert.match(statements[2], /NOT EXISTS/);
});

test("surfaces database errors instead of reporting successful cleanup", async () => {
  const db = {
    query(_sql, callback) {
      callback(new Error("database unavailable"));
    },
  };

  await assert.rejects(cleanupUnverifiedAccounts(db), /database unavailable/);
});
