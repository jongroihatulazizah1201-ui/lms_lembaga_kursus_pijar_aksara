# Laporan Hasil Uji Keamanan Webhook Mayar
LMS Lembaga Kursus Pijar Aksara

Tanggal Uji: 25 Oktober 2026
Lingkungan: Local Next.js 16 Production Runtime (`NODE_ENV=production`, `MAYAR_MODE=production`)
Endpoint Diuji: `/api/webhooks/mayar`
Secret Webhook: Terlindungi (string rahasia heksadesimal dengan placeholder `<RAHASIA>`)

---

## 1. Ringkasan Hasil Pengujian

Semua 10 skenario pengujian keamanan webhook pembayaran Mayar telah berhasil dieksekusi dengan status **LULUS (100%)**.

| ID | Kasus Uji | Perintah Uji | HTTP Status | Status DB Pendaftaran | Hasil |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UJI-1.1** | Tanpa token rahasia | `POST /api/webhooks/mayar` (tanpa parameter token) | 401 | menunggu_bayar | LULUS |
| **UJI-1.2** | Token salah / tebakan | `POST /api/webhooks/mayar?token=<RAHASIA_PALSU>` | 401 | menunggu_bayar | LULUS |
| **UJI-2** | ID mock inv_sb_ pada mode produksi | `POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_sb_150000_123`) | 400 | menunggu_bayar | LULUS |
| **UJI-3** | Invoice belum dibayar menurut GET Mayar | `POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_unpaid_123`) | 400 | menunggu_bayar | LULUS |
| **UJI-4** | Nominal berbeda (Rp 75.000 vs Rp 150.000) | `POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_diff_amount_123`) | 400 | menunggu_bayar | LULUS |
| **UJI-5** | Invoice tidak terdaftar di database | `POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_unregistered_id_999`) | 404 | - | LULUS |
| **UJI-6** | Webhook dikirim dua kali sekuensial (Idempotensi) | `POST /api/webhooks/mayar?token=<RAHASIA>` (`id: inv_valid_paid_123`) 2x berturut-turut | 200 -> 200 | aktif -> aktif (Audit Log: 1) | LULUS |
| **UJI-7** | Peserta memanggil webhook sendiri dengan ID invoicenya | `POST /api/webhooks/mayar?token=<RAHASIA_TEBAKAN>` (`id: inv_student_own_123`) | 401 | menunggu_bayar | LULUS |
| **UJI-8** | Event payment.reminder untuk invoice valid | `POST /api/webhooks/mayar?token=<RAHASIA>` (`event: payment.reminder`) | 200 | menunggu_bayar (Diabaikan) | LULUS |
| **UJI-9** | Dua webhook identik BERSAMAAN (Promise.all) | `Promise.all([postWebhook, postWebhook])` (`inv_concurrent_paid_123`) | 200 & 200 | aktif (Audit Log: Tepat 1, Email: Tepat 1) | LULUS |
| **UJI-10** | Pembayaran Sandbox Mayar Sungguhan End-to-End | `POST /api/webhooks/mayar?token=<RAHASIA>` (Real Mayar Closed Invoice) | 200 | aktif (Audit Log: 1, Metode: mayar) | LULUS |

---

## 2. Struktur Payload Nyata Mayar (`payment.received`)

Berdasarkan integrasi resmi dan spesifikasi Mayar Webhook API v2 (sandbox `api.mayar.club` / `api.mayar.io`), payload yang dikirim saat pembayaran berhasil diselesaikan peserta memiliki struktur dan nama field/kunci sebagai berikut (tanpa data pribadi/PII):

```json
{
  "event": "payment.received",
  "data": {
    "id": "<TRANSACTION_OR_INVOICE_ID>",
    "transactionId": "<TRANSACTION_UUID>",
    "paymentLinkId": "<INVOICE_OR_PAYMENT_LINK_UUID>",
    "status": "SUCCESS",
    "transactionStatus": "created",
    "amount": 10000,
    "paymentMethod": "QRIS",
    "customerName": "<NAMA_PELANGGAN>",
    "customerEmail": "<EMAIL_PELANGGAN>",
    "customerMobile": "<NOMOR_HP_PELANGGAN>",
    "productName": "<DESKRIPSI_PRODUK>",
    "createdAt": 1792910436016,
    "updatedAt": 1792910704927
  }
}
```

### Aturan Pencocokan Data:
1. **Identifier Invoice:** Handler membaca `invoiceId` dari `data.paymentLinkId`, `data.id`, `data.invoiceId`, atau `data.transactionId`.
2. **Kunci Pencarian Mandiri:** Pencocokan ke pendaftaran di database **hanya menggunakan kolom `mayar_invoice_id`** yang tersimpan di baris pendaftaran saat invoice dibuat.
3. **Anti-Tampering:** Handler tidak mengandalkan field custom `pendaftaranId` dari payload publik. Setelah pendaftaran ditemukan via `mayar_invoice_id`, server memverifikasi langsung ke API Mayar (`GET /hl/v2/invoices/:id`).

---

## 3. Penjelasan Mock Respons Mayar pada Pengujian & Pembersihan Kode Produksi

1. **Bagaimana respons Mayar dipalsukan saat uji:**
   - Respons Mayar untuk ID uji (`inv_unpaid_123`, `inv_diff_amount_123`, `inv_valid_paid_123`, `inv_reminder_valid_123`, `inv_concurrent_paid_123`) dipalsukan menggunakan **mock HTTP server mandiri** yang dijalankan di proses uji pada port 4000.
   - Next.js diarahkan ke mock server ini secara eksklusif saat pengujian melalui variabel lingkungan `MAYAR_BASE_URL=http://127.0.0.1:4000/hl/v2`.
2. **Pembersihan dari Kode Produksi (`src/`):**
   - Seluruh percabangan yang mengenali awalan `inv_sb_` atau mock ID lokal pada file `src/lib/mayar.ts` telah **dihapus sepenuhnya**.
   - Kode produksi pada `src/lib/mayar.ts` dan `src/app/api/webhooks/mayar/route.ts` kini murni melakukan panggilan HTTP ke Mayar API (`${baseUrl}/invoices/...`) dan menyertakan field wajib `items` saat membuat tagihan.

---

## 4. Bukti Detail Eksekusi per Kasus Uji

### UJI-1.1: Tanpa Token Rahasia
- **Perintah Eksekusi:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","id":"inv_valid_paid_123"}'
```
- **Respons Server:**
```json
HTTP/1.1 401 Unauthorized
{
  "error": "Akses tidak sah: Token otorisasi webhook tidak valid atau tidak disertakan."
}
```
- **Verifikasi Integritas:** Server menolak request sebelum parsing payload dan tanpa query DB.

### UJI-1.2: Token Salah / Tebakan
- **Perintah Eksekusi:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA_PALSU>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","id":"inv_valid_paid_123"}'
```
- **Respons Server:**
```json
HTTP/1.1 401 Unauthorized
{
  "error": "Akses tidak sah: Token otorisasi webhook tidak valid atau tidak disertakan."
}
```

### UJI-2: ID Mock inv_sb_ pada Mode Produksi
- **Perintah Eksekusi:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","id":"inv_sb_150000_123"}'
```
- **Respons Server:**
```json
HTTP/1.1 400 Bad Request
{
  "error": "Gagal melakukan verifikasi ulang data tagihan ke API Mayar."
}
```
- **Pemeriksaan Database Supabase:**
```sql
SELECT id, status FROM public.pendaftaran WHERE mayar_invoice_id = 'inv_sb_150000_123';
-- Hasil: status = 'menunggu_bayar' (TIDAK AKTIF)
```

### UJI-3: Invoice Belum Dibayar Menurut GET Mayar
- **Perintah Eksekusi:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","id":"inv_unpaid_123"}'
```
- **Respons Server:**
```json
HTTP/1.1 400 Bad Request
{
  "error": "Verifikasi status pembayaran gagal."
}
```
- **Pemeriksaan Database Supabase:**
```sql
SELECT id, status FROM public.pendaftaran WHERE mayar_invoice_id = 'inv_unpaid_123';
-- Hasil: status = 'menunggu_bayar' (TIDAK AKTIF)
```

### UJI-4: Nominal Berbeda (LMS Mengharapkan Rp 150.000, Mayar Mencatat Rp 75.000)
- **Perintah Eksekusi:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","id":"inv_diff_amount_123"}'
```
- **Respons Server:**
```json
HTTP/1.1 400 Bad Request
{
  "error": "Verifikasi nominal pembayaran gagal."
}
```
- **Catatan Keamanan (Pesan Generik):** Pesan error tidak membocorkan nominal yang diharapkan ke pemanggil publik. Detail perbedaan nominal hanya dicatat di server log secara aman tanpa token.

### UJI-5: Invoice Tidak Terdaftar di Database
- **Perintah Eksekusi:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","id":"inv_unregistered_id_999"}'
```
- **Respons Server:**
```json
HTTP/1.1 404 Not Found
{
  "error": "Data pendaftaran tidak ditemukan."
}
```

### UJI-6: Webhook Dikirim Dua Kali Sekuensial (Idempotensi)
- **Perintah Kiriman Pertama:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","id":"inv_valid_paid_123"}'
```
- **Respons Kiriman Pertama:**
```json
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Pembayaran berhasil diverifikasi secara sah melalui API Mayar dan pendaftaran kini aktif.",
  "pendaftaran": { "id": "d4444444-4444-4444-d444-444444444405", "status": "aktif" }
}
```
- **Perintah Kiriman Kedua:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","id":"inv_valid_paid_123"}'
```
- **Respons Kiriman Kedua:**
```json
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Idempotent: Pembayaran ini telah diproses sebelumnya dan pendaftaran sudah aktif.",
  "pendaftaranId": "d4444444-4444-4444-d444-444444444405",
  "status": "aktif"
}
```
- **Pemeriksaan Database Supabase:**
```sql
SELECT count(*) FROM public.audit_log WHERE id_data = 'd4444444-4444-4444-d444-444444444405' AND aksi = 'konfirmasi_pembayaran_mayar';
-- Hasil: count = 1 (TIDAK ADA DUPLIKASI AUDIT LOG)
```

### UJI-7: Peserta Memanggil Webhook Sendiri dengan ID Invoicenya
- **Perintah Eksekusi:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA_TEBAKAN>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","id":"inv_student_own_123"}'
```
- **Respons Server:**
```json
HTTP/1.1 401 Unauthorized
{
  "error": "Akses tidak sah: Token otorisasi webhook tidak valid atau tidak disertakan."
}
```

### UJI-8: Event payment.reminder untuk Invoice Valid
- **Perintah Eksekusi:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.reminder","id":"inv_reminder_valid_123"}'
```
- **Respons Server:**
```json
HTTP/1.1 200 OK
{
  "received": true,
  "ignored": true,
  "message": "Event 'payment.reminder' diabaikan, hanya payment.received yang diproses."
}
```
- **Pemeriksaan Database Supabase:**
```sql
SELECT id, status FROM public.pendaftaran WHERE mayar_invoice_id = 'inv_reminder_valid_123';
-- Hasil: status = 'menunggu_bayar' (TIDAK BERUBAH)
```

### UJI-9: Dua Webhook payment.received Identik Dikirim Bersamaan (Promise.all)
- **Perintah Eksekusi:**
```javascript
await Promise.all([
  postWebhook("http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>", { event: "payment.received", id: "inv_concurrent_paid_123" }),
  postWebhook("http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>", { event: "payment.received", id: "inv_concurrent_paid_123" })
]);
```
- **Respons Server:**
Kedua request merespons HTTP 200 OK (Request A berhasil mutasi status 'menunggu_bayar' -> 'aktif', Request B menerima respons idempotent).
- **Pemeriksaan Database Supabase:**
```sql
SELECT status FROM public.pendaftaran WHERE mayar_invoice_id = 'inv_concurrent_paid_123';
-- Hasil: status = 'aktif'

SELECT count(*) FROM public.audit_log WHERE id_data = 'd4444444-4444-4444-d444-444444444408' AND aksi = 'konfirmasi_pembayaran_mayar';
-- Hasil: count = 1 (TEPAT 1 BARIS AUDIT LOG)
```
- **Verifikasi Notifikasi Email:**
Tepat 1 email aktivasi dipicu (tidak ada dobel email ke peserta).

### UJI-10: Pembayaran Sandbox Mayar Sungguhan End-to-End
- **Perintah Eksekusi:**
```bash
curl -X POST "http://localhost:3001/api/webhooks/mayar?token=<RAHASIA>" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.received","data":{"id":"6410bd36-cef2-4f0d-bf13-baa8f3835622","status":"SUCCESS","amount":10000}}'
```
- **Respons Server:**
```json
HTTP/1.1 200 OK
{
  "success": true,
  "message": "Pembayaran berhasil diverifikasi secara sah melalui API Mayar dan pendaftaran kini aktif.",
  "pendaftaran": {
    "id": "d4444444-4444-4444-d444-444444444409",
    "status": "aktif",
    "metode_bayar": "mayar"
  }
}
```
- **Pemeriksaan Database Supabase:**
```sql
SELECT id, status, metode_bayar, dibayar_pada FROM public.pendaftaran WHERE id = 'd4444444-4444-4444-d444-444444444409';
-- Hasil: status = 'aktif', metode_bayar = 'mayar', dibayar_pada NOT NULL
```

---

## 5. Konfigurasi URL Webhook untuk Dashboard Mayar

Sesuai rancangan keamanan token rahasia, URL webhook yang harus didaftarkan pada Dashboard Mayar (**Integration -> Webhook**) adalah:

```
https://lmslembagakursuspijaraksara.netlify.app/api/webhooks/mayar?token=<NILAI_MAYAR_WEBHOOK_SECRET>
```

Pastikan variabel lingkungan berikut telah ditambahkan di Netlify Environment Variables:
- `MAYAR_WEBHOOK_SECRET` = String rahasia minimal 32 karakter
- `MAYAR_MODE` = `production` (atau biarkan kosong/tidak diatur ke 'sandbox' pada environment produksi)
