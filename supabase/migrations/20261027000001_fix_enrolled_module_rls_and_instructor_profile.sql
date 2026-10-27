-- Fix RLS: Izinkan peserta terdaftar mengakses modul pada kursus yang berstatus ditutup (BR-02: peserta lama tetap belajar)
-- Serta izinkan pengguna terautentikasi membaca profil instruktur (nama_lengkap, dll)

-- 1. Perbarui policy modul_select
DROP POLICY IF EXISTS modul_select ON public.modul;
CREATE POLICY modul_select ON public.modul
FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM public.kursus WHERE kursus.id = modul.kursus_id AND kursus.status = 'terbit'))
  OR (EXISTS (SELECT 1 FROM public.kursus WHERE kursus.id = modul.kursus_id AND kursus.instruktur_id = auth.uid()))
  OR (public.current_user_role() = 'admin')
  OR ((auth.uid() IS NOT NULL) AND public.is_peserta_kursus(kursus_id, auth.uid()))
);

-- 2. Perbarui policy profil instruktur agar pengguna login (peserta) juga dapat melihat nama instruktur
DROP POLICY IF EXISTS profiles_select_instruktur_public ON public.profiles;
DROP POLICY IF EXISTS profiles_select_instruktur ON public.profiles;
CREATE POLICY profiles_select_instruktur ON public.profiles
FOR SELECT
TO anon, authenticated
USING (peran = 'instruktur'::peran_enum);
