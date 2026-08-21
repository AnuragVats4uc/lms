-- Run while connected to the LMS database.

-- Total schema size.
SELECT
  table_schema AS database_name,
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_size_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
GROUP BY table_schema;

-- Largest tables and InnoDB's approximate row counts.
SELECT
  table_name,
  table_rows AS approximate_row_count,
  ROUND(data_length / 1024 / 1024, 2) AS data_size_mb,
  ROUND(index_length / 1024 / 1024, 2) AS index_size_mb,
  ROUND((data_length + index_length) / 1024 / 1024, 2) AS total_size_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY data_length + index_length DESC, table_name;
