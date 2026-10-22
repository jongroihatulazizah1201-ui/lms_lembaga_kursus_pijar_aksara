-- Migrasi: Penegakan Alur Status Kursus (Tabel 6.1 PRD & BR-02, BR-03)
-- Menolak perpindahan status kursus yang tidak sah di level database

CREATE OR REPLACE FUNCTION public.fn_validasi_status_kursus()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_modul_count integer;
  v_min_soal integer;
  v_max_urutan integer;
  v_modul_rec record;
BEGIN
  -- Hanya proses jika ada perubahan status
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Dapatkan role user yang sedang login (jika via Auth)
  v_role := public.current_user_role();

  -- 1. draf -> ditinjau (Instruktur mengajukan kursus)
  IF OLD.status = 'draf' AND NEW.status = 'ditinjau' THEN
    -- Instruktur pemilik atau admin yang berhak mengajukan
    IF auth.uid() IS NOT NULL AND v_role <> 'admin' AND OLD.instruktur_id <> auth.uid() THEN
      RAISE EXCEPTION 'Pengajuan ditolak: Hanya instruktur pemilik yang boleh mengajukan kursus untuk ditinjau';
    END IF;

    -- Syarat BR-03:
    -- - Jumlah modul harus 2 sampai 10
    SELECT count(*), coalesce(max(urutan), 0) INTO v_modul_count, v_max_urutan
    FROM public.modul WHERE kursus_id = OLD.id;

    IF v_modul_count < 2 OR v_modul_count > 10 THEN
      RAISE EXCEPTION 'Pengajuan kursus ditolak: Kursus harus memiliki antara 2 sampai 10 modul (saat ini: % modul)', v_modul_count;
    END IF;

    -- - Tanpa lompatan urutan (urutan 1 sampai N)
    IF v_max_urutan <> v_modul_count THEN
      RAISE EXCEPTION 'Pengajuan kursus ditolak: Nomor urut modul tidak boleh memiliki lompatan (urutan 1 sampai %)', v_modul_count;
    END IF;

    -- - Setiap modul harus memiliki 3 sampai 20 soal
    FOR v_modul_rec IN 
      SELECT m.urutan, m.judul, count(s.id) as jml_soal
      FROM public.modul m
      LEFT JOIN public.soal s ON s.modul_id = m.id
      WHERE m.kursus_id = OLD.id
      GROUP BY m.id, m.urutan, m.judul
    LOOP
      IF v_modul_rec.jml_soal < 3 OR v_modul_rec.jml_soal > 20 THEN
        RAISE EXCEPTION 'Pengajuan kursus ditolak: Modul % ("%") harus memiliki 3 sampai 20 soal (saat ini: % soal)', 
          v_modul_rec.urutan, v_modul_rec.judul, v_modul_rec.jml_soal;
      END IF;
    END LOOP;

    NEW.diajukan_pada := now();
    NEW.diubah_pada := now();
    RETURN NEW;

  -- 2. ditinjau -> terbit (Admin menerbitkan kursus)
  ELSIF OLD.status = 'ditinjau' AND NEW.status = 'terbit' THEN
    IF auth.uid() IS NOT NULL AND v_role <> 'admin' THEN
      RAISE EXCEPTION 'Penerbitan ditolak: Hanya admin yang boleh menerbitkan kursus';
    END IF;

    NEW.diterbitkan_pada := COALESCE(OLD.diterbitkan_pada, now());
    NEW.diubah_pada := now();
    RETURN NEW;

  -- 3. ditinjau -> draf (Admin mengembalikan kursus dengan catatan)
  ELSIF OLD.status = 'ditinjau' AND NEW.status = 'draf' THEN
    IF auth.uid() IS NOT NULL AND v_role <> 'admin' THEN
      RAISE EXCEPTION 'Pengembalian ditolak: Hanya admin yang boleh mengembalikan kursus ke status draf';
    END IF;

    -- Wajib catatan pengembalian minimal 10 karakter
    IF NEW.catatan_tinjauan IS NULL OR char_length(trim(NEW.catatan_tinjauan)) < 10 THEN
      RAISE EXCEPTION 'Pengembalian kursus ke draf ditolak: Wajib menyertakan catatan tinjauan minimal 10 karakter';
    END IF;

    NEW.diubah_pada := now();
    RETURN NEW;

  -- 4. terbit -> ditutup (Admin menutup kursus)
  ELSIF OLD.status = 'terbit' AND NEW.status = 'ditutup' THEN
    IF auth.uid() IS NOT NULL AND v_role <> 'admin' THEN
      RAISE EXCEPTION 'Penutupan ditolak: Hanya admin yang boleh menutup kursus';
    END IF;

    NEW.diubah_pada := now();
    RETURN NEW;

  -- 5. ditutup -> terbit (Admin membuka kembali kursus)
  ELSIF OLD.status = 'ditutup' AND NEW.status = 'terbit' THEN
    IF auth.uid() IS NOT NULL AND v_role <> 'admin' THEN
      RAISE EXCEPTION 'Pembukaan kembali ditolak: Hanya admin yang boleh membuka kembali kursus yang ditutup';
    END IF;

    NEW.diterbitkan_pada := now();
    NEW.diubah_pada := now();
    RETURN NEW;

  -- Perpindahan status lainnya DITOLAK KERAS
  ELSE
    RAISE EXCEPTION 'Perpindahan status kursus tidak diizinkan: dari "%" ke "%"', OLD.status, NEW.status;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validasi_status_kursus ON public.kursus;
CREATE TRIGGER trg_validasi_status_kursus
  BEFORE UPDATE OF status ON public.kursus
  FOR EACH ROW EXECUTE FUNCTION public.fn_validasi_status_kursus();
