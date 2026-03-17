-- Run this FIRST to clean up, then run 001_initial_schema.sql
DROP TABLE IF EXISTS attendance  CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS sessions    CASCADE;
DROP TABLE IF EXISTS students    CASCADE;
DROP TABLE IF EXISTS courses     CASCADE;
DROP TABLE IF EXISTS teachers    CASCADE;

DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS course_type       CASCADE;
DROP TYPE IF EXISTS course_level      CASCADE;

DROP FUNCTION IF EXISTS update_updated_at CASCADE;
