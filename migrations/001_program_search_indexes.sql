ALTER TABLE programs
  ADD INDEX idx_program_search (status, degree_type, name, level);

ALTER TABLE campus_programs
  ADD INDEX idx_cp_published (status, campus_id, program_id);
