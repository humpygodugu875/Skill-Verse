-- =========================================================================
-- Migration: Add difficulty and topic columns to quiz_questions
-- These columns power topic-aware quiz generation and UI filtering.
-- =========================================================================

BEGIN;

ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS topic      TEXT NOT NULL DEFAULT '';

COMMIT;
