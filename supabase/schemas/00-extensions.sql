-- Enable pg_trgm extension for fuzzy text search
-- This extension provides similarity matching and fuzzy search capabilities using trigrams
create extension if not exists pg_trgm;
