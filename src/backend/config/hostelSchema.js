
const query = (db, sql) =>
  new Promise((resolve, reject) => {
    db.query(sql, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const createHostelSchema = async (db) => {
  const tables = [
    // 1. HOSTELS
    `CREATE TABLE IF NOT EXISTS hostels (
      id VARCHAR(255) PRIMARY KEY,
      owner_uid VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      hostel_type ENUM('private', 'university') NOT NULL,
      campus_id VARCHAR(255) NULL,
      address TEXT NULL,
      lat DECIMAL(10,8) NULL,
      lng DECIMAL(11,8) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_hostel_owner (owner_uid),
      INDEX idx_hostel_campus (campus_id),
      INDEX idx_hostel_status (status),

      CONSTRAINT fk_hostel_owner
        FOREIGN KEY (owner_uid)
        REFERENCES Student_signup(id)
        ON DELETE RESTRICT
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_general_ci`,

    // 2. HOSTEL DOCUMENTS
    `CREATE TABLE IF NOT EXISTS hostel_documents (
      id VARCHAR(255) PRIMARY KEY,
      hostel_id VARCHAR(255) NOT NULL,
      document_type ENUM(
        'cnic',
        'utility_bill',
        'ownership_proof',
        'campus_authorization',
        'lease_agreement',
        'management_authorization',
        'registration_certificate',
        'other'
      ) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      original_name VARCHAR(255) NULL,
      verification_status ENUM(
        'pending',
        'verified',
        'rejected'
      ) NOT NULL DEFAULT 'pending',
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_document_hostel (hostel_id),

      CONSTRAINT fk_document_hostel
        FOREIGN KEY (hostel_id)
        REFERENCES hostels(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_general_ci`,

    // 3. HOSTEL ROOMS
    `CREATE TABLE IF NOT EXISTS hostel_rooms (
      id VARCHAR(255) PRIMARY KEY,
      hostel_id VARCHAR(255) NOT NULL,
      room_type VARCHAR(100) NOT NULL,
      total_rooms INT NOT NULL DEFAULT 0,
      beds_per_room INT NOT NULL DEFAULT 1,
      available_beds INT NOT NULL DEFAULT 0,
      monthly_rent DECIMAL(10,2) NOT NULL,
      description TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_room_hostel (hostel_id),

      CONSTRAINT fk_room_hostel
        FOREIGN KEY (hostel_id)
        REFERENCES hostels(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_general_ci`,

    // 4. HOSTEL PHOTOS
    `CREATE TABLE IF NOT EXISTS hostel_photos (
      id VARCHAR(255) PRIMARY KEY,
      hostel_id VARCHAR(255) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      caption VARCHAR(255) NULL,
      is_cover TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_photo_hostel (hostel_id),

      CONSTRAINT fk_photo_hostel
        FOREIGN KEY (hostel_id)
        REFERENCES hostels(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_general_ci`,

    // 5. HOSTEL LISTING DETAILS
    `CREATE TABLE IF NOT EXISTS hostel_listing_details (
      hostel_id VARCHAR(255) PRIMARY KEY,
      description TEXT NULL,
      gender VARCHAR(30) NULL,
      contact_phone VARCHAR(50) NULL,
      contact_email VARCHAR(254) NULL,
      amenities JSON NULL,
      mess_details JSON NULL,
      additional_fees JSON NULL,
      hostel_rules TEXT NULL,
      check_in_time VARCHAR(30) NULL,
      check_out_time VARCHAR(30) NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      CONSTRAINT fk_listing_hostel
        FOREIGN KEY (hostel_id)
        REFERENCES hostels(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_general_ci`,

    // 6. HOSTEL APPROVAL HISTORY
    `CREATE TABLE IF NOT EXISTS hostel_approvals (
      id VARCHAR(255) PRIMARY KEY,
      hostel_id VARCHAR(255) NOT NULL,
      reviewer_uid VARCHAR(255) NOT NULL,
      reviewer_role ENUM(
        'campus',
        'university',
        'admin'
      ) NOT NULL,
      decision ENUM(
        'approved',
        'rejected',
        'changes_requested'
      ) NOT NULL,
      reason TEXT NULL,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_approval_hostel (hostel_id),
      INDEX idx_approval_reviewer (reviewer_uid),

      CONSTRAINT fk_approval_hostel
        FOREIGN KEY (hostel_id)
        REFERENCES hostels(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_general_ci`
  ];

  for (const sql of tables) {
    try {
      await query(db, sql);
      const tableName = sql.match(
        /CREATE TABLE IF NOT EXISTS (\w+)/i
      )?.[1];

      console.log(`${tableName} table ready`);
    } catch (err) {
      console.error("Hostel schema error:", err.message);
      throw err;
    }
  }

  try {
    await query(db, `ALTER TABLE hostel_documents MODIFY COLUMN document_type ENUM(
      'cnic', 'utility_bill', 'ownership_proof', 'campus_authorization',
      'lease_agreement', 'management_authorization', 'registration_certificate', 'other'
    ) NOT NULL`);
  } catch (err) {
    console.error("Hostel document type migration error:", err.message);
    throw err;
  }

  try {
    await query(db, `ALTER TABLE hostel_approvals MODIFY COLUMN reviewer_role ENUM('campus', 'university', 'admin') NOT NULL`);
  } catch (err) {
    console.error("Hostel reviewer role migration error:", err.message);
    throw err;
  }

  try {
    await query(db, `UPDATE hostels
      SET status = CASE
        WHEN hostel_type = 'university' THEN 'pending_campus'
        ELSE 'pending_admin'
      END
      WHERE status = 'under_review'`);
  } catch (err) {
    console.error("Hostel review status migration error:", err.message);
    throw err;
  }

  console.log("All hostel tables ready");
};

export default createHostelSchema;
