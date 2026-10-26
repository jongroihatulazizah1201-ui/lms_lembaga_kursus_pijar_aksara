-- Migrasi: Menghapus RPC Verifikasi Sertifikat Publik agar sepenuhnya patuh pada PRD Bagian 14 (Di Luar Lingkup)
-- Berdasarkan PRD Bagian 14: 'verifikasi sertifikat publik' berada di luar lingkup (Out of Scope).
-- Sertifikat kelulusan hanya dapat diakses secara privat oleh peserta bersangkutan (BR-11 & BR-12) via get_sertifikat_detail.

DROP FUNCTION IF EXISTS public.verify_certificate_status(text);
