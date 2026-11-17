# PASSAPU — Penerjemah Bahasa Konjo ke Indonesia

Website penerjemah **bahasa Konjo dialek Kajang** ke **bahasa Indonesia** dengan **algoritma Longest Match**, Kecamatan Kajang, Kabupaten Bulukumba. Dibangun dengan HTML5, CSS3, dan JavaScript murni, berjalan sepenuhnya di sisi pengguna (tanpa server basis data), dan dapat dibuka di peramban ponsel maupun komputer.

Tampilan mengikuti desain *Radial Sidebar* bergaya desktop Ubuntu dengan palet **Midnight Navy** `#102C40`, **Cloud White** `#F7FAFC`, dan **Electric Lime** `#DBFF00` (diatur sebagai variabel CSS di awal `css/style.css`). Tombol lime di sisi kiri membuka menu radial beranimasi berisi tiga aspek:

| Menu | Isi |
| --- | --- |
| **Terjemah** | Kolom masukan, hasil terjemahan (kata tidak ditemukan ditandai merah), statistik, rincian kata, jejak proses Longest Match, riwayat & statistik penggunaan (`localStorage`) |
| **Bahasa** | Informasi bahasa Konjo (tiga dialek menurut Badan Bahasa) dan kamus yang dapat dicari serta difilter per kategori |
| **Lokasi** | Peta Google Maps Embed Kecamatan Kajang, Kawasan Adat Ammatoa, batas wilayah, dan daftar 19 desa/kelurahan |

## Struktur berkas

```
index.html              Halaman utama (panel atas, jendela, menu radial, tiga tampilan)
css/style.css           Tema, animasi menu radial, dan tata letak responsif
css/mobile.css          Tambahan tampilan HP/Android (tidak mengubah tampilan desktop)
js/dictionary.js        Basis data kamus (82 kata, 6 kategori, 6 frasa)
js/longest-match.js     Mesin penerjemah: normalisasi, tokenisasi, Longest Match
js/app.js               Antarmuka: menu radial, navigasi, penerjemah, riwayat, kamus, peta
js/mobile.js            Tambahan perilaku tampilan HP/Android
assets/logo.png         Logo PASSAPU (panel atas, judul, kaki halaman)
assets/favicon.png      Ikon tab peramban (dibuat dari logo)
assets/apple-touch-icon.png  Ikon layar utama iPhone/iPad
tests/                  Pengujian algoritma (node:test)
```

## Menjalankan

- Cukup buka `index.html` di peramban, **atau**
- jalankan server lokal dari folder proyek, misalnya `python -m http.server 8000`, lalu buka `http://localhost:8000`.

Pintasan: tekan **M** untuk membuka/menutup menu radial, **1–3** untuk memilih menu saat terbuka, **Esc** untuk menutup, dan **Ctrl + Enter** di kolom masukan untuk menerjemahkan sekaligus menyimpan ke riwayat.

## Cara kerja algoritma (sesuai flowchart)

1. Pengguna memilih arah terjemahan dan mengetik teks.
2. Teks dinormalisasi (huruf kecil, apostrof dihapus, spasi dirapikan) lalu dipecah menjadi token kata, spasi, dan tanda baca.
3. Mulai dari kata ke-`i = 1`, panjang pencocokan `n` diawali dari **n maks** (jumlah kata terpanjang pada entri kamus). Jika rangkaian `n` kata ditemukan, rangkaian diganti padanannya dan posisi bergeser `n` kata; jika tidak, `n` dikurangi satu hingga `n = 1`. Kata yang tetap tidak ditemukan ditandai merah dengan keterangan “tidak ditemukan”. Frasa tidak dicocokkan melewati tanda baca.
4. Hasil disusun menjadi kalimat (tanda baca dan huruf kapital dipertahankan) beserta jumlah kata dikenali/tidak dikenali; riwayat dan statistik disimpan di `localStorage`.
5. Terjemahan, rincian kata, dan jejak prosesnya ditampilkan.

Contoh: `Apa kareba, kau macca sikali.` → `Apa kabar, kamu pintar sekali.`

## Menambah entri kamus

Tambahkan objek baru ke array `KATA` atau `FRASA` di `js/dictionary.js`:

```js
{ konjo: "a'lampa", indonesia: 'pergi', kategori: 'kerja' },
{ konjo: 'borong karamaka', indonesia: 'hutan keramat', kategori: 'frasa', keterangan: '…' },
```

Kolom opsional: `keterangan` (catatan makna), `varian` (ejaan Konjo lain, mis. `inakke` untuk `nakke`), dan `sinonim` (padanan Indonesia lain untuk arah Indonesia → Konjo). Nilai **n maks** dihitung otomatis, jadi frasa tiga kata atau lebih langsung didukung. Jalankan pengujian setelah mengubah kamus untuk memastikan tidak ada kunci yang bentrok setelah normalisasi (misalnya `amma` dan `amma'`).

## Tampilan HP / Android

Saat dibuka di ponsel (lebar layar ≤ 760 px, atau ponsel dalam posisi mendatar), tampilan otomatis berubah menjadi seperti aplikasi Android:

- **Bilah aplikasi atas** berisi logo, nama PASSAPU, dan nama menu yang sedang dibuka, menggantikan panel atas bergaya Ubuntu dan bingkai jendela peramban.
- **Bilah bawah** dengan tombol radial di lekukan tengah. Menu radial terbuka setengah lingkaran ke atas agar mudah dijangkau ibu jari. Tombol kiri menampilkan menu aktif (ketuk untuk membuka menu), tombol kanan menuju **Riwayat**.
- Konten selebar layar, baris contoh/filter/tab dapat digeser ke samping, kartu fakta menjadi *carousel*, dan kamus tampil dua kolom.

Semua ini ditambahkan lewat `css/mobile.css`, `js/mobile.js`, serta elemen bertanda “Tambahan HP/Android” di `index.html`; kode tampilan desktop tidak diubah.

## Mengganti logo

Logo ditampilkan di panel atas, di samping judul **PASSAPU**, dan di kaki halaman. Untuk menggantinya, timpa `assets/logo.png` dengan logo baru bernama sama (disarankan persegi, latar transparan, ±512 × 512 px). Logo diletakkan di atas lingkaran berwarna terang sehingga logo berwarna gelap tetap terlihat. Bila berkas tidak ditemukan, tempat logo menampilkan tulisan “LOGO”. Ganti juga `assets/favicon.png` (96 × 96 px) dan `assets/apple-touch-icon.png` (180 × 180 px) agar ikon tab ikut berubah.

## Pengujian

```bash
node --test
```

Pengujian mencakup contoh pada dokumen usulan, jumlah entri kamus, keunikan kunci setelah normalisasi, prioritas frasa terpanjang, batas tanda baca, normalisasi, penandaan kata tidak ditemukan, dan arah Indonesia → Konjo.

## Deploy ke Vercel

1. Unggah folder proyek ke repositori GitHub.
2. Di Vercel, pilih **Add New → Project**, impor repositori, pilih *Framework Preset*: **Other**, kosongkan *Build Command*, lalu **Deploy**.

Tidak ada proses build; Vercel menyajikan berkas statis apa adanya.

## Sumber data

- Kosakata awal diverifikasi silang dengan Kamus Konjo Pesisir (MediaKonjo/SIL), contoh percakapan bahasa Konjo (detikSulsel), dan artikel *Pasang ri Kajang*. Seluruh entri **tetap perlu divalidasi oleh penutur asli** di Kecamatan Kajang sesuai metode penelitian.
- Informasi bahasa: Peta Bahasa dan Laboratorium Kebinekaan Bahasa, Badan Pengembangan dan Pembinaan Bahasa.
- Data wilayah: BPS Kabupaten Bulukumba — *Kecamatan Kajang Dalam Angka 2025* dan *Kabupaten Bulukumba Dalam Angka 2026*.
