-- Migration: Tambah kolom examDate (nullable DATE) pada AcademicSchedule
-- Mendukung Dynamic Pre-Exam Escalation Curve di backend/src/services/burnoutScoring.ts
-- Kolom bersifat nullable agar 100% backward-compatible dengan baris jadwal lama.

ALTER TABLE `AcademicSchedule`
  ADD COLUMN `examDate` DATE NULL;
