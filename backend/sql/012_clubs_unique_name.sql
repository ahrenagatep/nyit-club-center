-- 012_clubs_unique_name.sql
-- Club names must be unique
--      ignoring case ("Chess Club" and "chess club" count as duplicates).

-- SELECT lower(name), COUNT(*) FROM clubs GROUP BY lower(name) HAVING COUNT(*) > 1;
-- ^^ run this to check for any duplicate club names

CREATE UNIQUE INDEX IF NOT EXISTS uq_clubs_name_lower ON clubs (lower(name));