const cleanupQuery = (db, sql) =>
  new Promise((resolve, reject) => {
    db.query(sql, (error, result) => (error ? reject(error) : resolve(result)));
  });

export const cleanupUnverifiedAccounts = async (db) => {
  let totalDeleted = 0;
  let batchDeleted;
  do {
    const result = await cleanupQuery(
      db,
      `DELETE FROM Student_signup
       WHERE email_verified = 0
         AND email_verification_expires_at IS NOT NULL
         AND email_verification_expires_at <= NOW()
       ORDER BY email_verification_expires_at
       LIMIT 500`,
    );
    batchDeleted = result.affectedRows || 0;
    totalDeleted += batchDeleted;
  } while (batchDeleted === 500);

  await cleanupQuery(
    db,
    `DELETE FROM email_verification_tokens
     WHERE expires_at <= NOW()
        OR NOT EXISTS (
          SELECT 1 FROM Student_signup
          WHERE Student_signup.id = email_verification_tokens.user_id
        )`,
  );

  return totalDeleted;
};
