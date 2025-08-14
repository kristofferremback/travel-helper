-- Initialize the database for local development
-- This file runs automatically when the PostgreSQL container starts for the first time

-- Create the main database (already created by POSTGRES_DB, but this is explicit)
-- CREATE DATABASE travel_helper;

-- You can add any initial setup here if needed
-- For example, creating additional schemas, users, etc.

-- The database is ready for Prisma migrations
SELECT 'PostgreSQL database initialized for Travel Helper app' as message;
