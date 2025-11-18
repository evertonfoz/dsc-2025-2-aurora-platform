-- Creates the unified database and initial schemas for the course/lab.
-- This script is executed by the official postgres image only the first time the volume is initialized.

-- Create database (if POSTGRES_DB is not already set by environment)
-- Note: docker-compose already sets POSTGRES_DB=aurora_db in this repo; this script ensures DB exists if needed.
CREATE DATABASE aurora_db;
\connect aurora_db;

CREATE SCHEMA IF NOT EXISTS events AUTHORIZATION postgres;
CREATE SCHEMA IF NOT EXISTS users AUTHORIZATION postgres;
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION postgres;
