/*!
 * PASSAPU — dictionary.js (basis data kamus Konjo–Indonesia)
 * Bahasa Konjo dialek Kajang, Kecamatan Kajang, Kabupaten Bulukumba.
 *
 * Kamus versi awal: 82 kata dalam enam kategori dan 6 frasa (n maks = 2).
 *
 * Struktur entri:
 *   konjo       kata/frasa bahasa Konjo (apostrof menandai hamzah, mis. kasi')
 *   indonesia   padanan bahasa Indonesia
 *   kategori    id kategori (lihat KATEGORI) — khusus frasa memakai 'frasa'
 *   keterangan  (opsional) catatan makna/penggunaan
 *   varian      (opsional) ejaan lain dalam bahasa Konjo
 *   sinonim     (opsional) padanan Indonesia lain, dipakai untuk arah Indonesia → Konjo
 *
 * Menambah entri: cukup tambahkan objek baru ke array KATA atau FRASA.
 * Nilai n maks dihitung otomatis dari entri terpanjang, jadi frasa tiga kata
 * atau lebih langsung didukung algoritma Longest Match.
 *
 * Catatan: kosakata awal ini diverifikasi silang dengan Kamus Konjo Pesisir
 * (MediaKonjo/SIL) dan sumber tertulis lain, dan tetap perlu divalidasi oleh
 * penutur asli di Kecamatan Kajang.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KAMUS_PASSAPU = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KATEGORI = [
    { id: 'sapaan', nama: 'Sapaan & Kata Tugas', ringkas: 'Sapaan' },
    { id: 'orang', nama: 'Kata Ganti & Keluarga', ringkas: 'Orang' },
    { id: 'kerja', nama: 'Kata Kerja', ringkas: 'Kerja' },
    { id: 'sifat', nama: 'Kata Sifat & Keterangan', ringkas: 'Sifat' },
    { id: 'alam', nama: 'Alam & Benda', ringkas: 'Alam' },
    { id: 'bilangan', nama: 'Bilangan & Waktu', ringkas: 'Bilangan' }
  ];

  var KATA = [
    // 1. Sapaan & Kata Tugas
    { konjo: "tabe'", indonesia: 'permisi', kategori: 'sapaan', keterangan: 'Ucapan sopan saat lewat di depan orang atau menyela pembicaraan.' },
    { konjo: 'io', indonesia: 'ya', kategori: 'sapaan', keterangan: 'Jawaban "ya" untuk lawan bicara yang akrab atau sebaya.' },
    { konjo: "ie'", indonesia: 'iya', kategori: 'sapaan', keterangan: 'Jawaban "ya" yang hormat kepada orang yang lebih tua.' },
    { konjo: "anre'", indonesia: 'tidak', kategori: 'sapaan' },
    { konjo: 'apa', indonesia: 'apa', kategori: 'sapaan' },
    { konjo: 'inai', indonesia: 'siapa', kategori: 'sapaan' },
    { konjo: 'angngura', indonesia: 'kenapa', kategori: 'sapaan', sinonim: ['mengapa'] },
    { konjo: 'sikura', indonesia: 'berapa', kategori: 'sapaan' },
    { konjo: "ante'", indonesia: 'mana', kategori: 'sapaan' },
    { konjo: 'kareba', indonesia: 'kabar', kategori: 'sapaan' },
    { konjo: 'tarima', indonesia: 'terima', kategori: 'sapaan' },
    { konjo: 'ri', indonesia: 'di', kategori: 'sapaan', keterangan: 'Kata depan serbaguna; dapat bermakna "di" atau "ke".' },
    { konjo: 'battu', indonesia: 'dari', kategori: 'sapaan', keterangan: 'Juga bermakna datang atau tiba (di suatu tempat).' },
    { konjo: 'inni', indonesia: 'ini', kategori: 'sapaan' },
    { konjo: 'injo', indonesia: 'itu', kategori: 'sapaan' },

    // 2. Kata Ganti & Keluarga
    { konjo: 'nakke', indonesia: 'saya', kategori: 'orang', varian: ['inakke'], sinonim: ['aku'] },
    { konjo: 'kau', indonesia: 'kamu', kategori: 'orang', varian: ['ikau'], sinonim: ['engkau'] },
    { konjo: 'ia', indonesia: 'dia', kategori: 'orang' },
    { konjo: 'gitte', indonesia: 'Anda', kategori: 'orang', keterangan: 'Kata ganti hormat; juga dapat bermakna "kita".' },
    { konjo: "iangase'", indonesia: 'mereka', kategori: 'orang' },
    { konjo: 'tau', indonesia: 'orang', kategori: 'orang' },
    { konjo: 'amma', indonesia: 'bapak', kategori: 'orang', sinonim: ['ayah'], keterangan: 'Seperti pada sebutan Amma Toa (Ammatoa).' },
    { konjo: 'anrong', indonesia: 'ibu', kategori: 'orang' },
    { konjo: "ana'", indonesia: 'anak', kategori: 'orang' },
    { konjo: 'bohe', indonesia: 'nenek', kategori: 'orang', sinonim: ['kakek'], keterangan: 'Sebutan untuk nenek atau kakek.' },
    { konjo: 'kaka', indonesia: 'kakak', kategori: 'orang' },
    { konjo: "andi'", indonesia: 'adik', kategori: 'orang' },
    { konjo: 'bahine', indonesia: 'perempuan', kategori: 'orang' },
    { konjo: "buru'ne", indonesia: 'laki-laki', kategori: 'orang' },

    // 3. Kata Kerja
    { konjo: "a'lampa", indonesia: 'pergi', kategori: 'kerja' },
    { konjo: 'amminro', indonesia: 'pulang', kategori: 'kerja' },
    { konjo: "rie'", indonesia: 'ada', kategori: 'kerja', keterangan: 'Juga bermakna datang atau punya.' },
    { konjo: 'angnganre', indonesia: 'makan', kategori: 'kerja' },
    { konjo: 'angnginung', indonesia: 'minum', kategori: 'kerja' },
    { konjo: "a'tinro", indonesia: 'tidur', kategori: 'kerja' },
    { konjo: 'anjama', indonesia: 'bekerja', kategori: 'kerja' },
    { konjo: "a'bicara", indonesia: 'berbicara', kategori: 'kerja' },
    { konjo: "a'pilajara", indonesia: 'belajar', kategori: 'kerja' },
    { konjo: 'angngajara', indonesia: 'mengajar', kategori: 'kerja' },
    { konjo: "a'sikola", indonesia: 'bersekolah', kategori: 'kerja' },
    { konjo: 'angngitte', indonesia: 'melihat', kategori: 'kerja' },
    { konjo: "a'cidong", indonesia: 'duduk', kategori: 'kerja' },
    { konjo: 'ammantang', indonesia: 'tinggal', kategori: 'kerja' },

    // 4. Kata Sifat & Keterangan
    { konjo: 'macca', indonesia: 'pintar', kategori: 'sifat' },
    { konjo: 'sikali', indonesia: 'sekali', kategori: 'sifat' },
    { konjo: "haji'", indonesia: 'baik', kategori: 'sifat', varian: ["baji'"] },
    { konjo: 'ballo', indonesia: 'bagus', kategori: 'sifat', sinonim: ['cantik'] },
    { konjo: 'kodi', indonesia: 'jelek', kategori: 'sifat' },
    { konjo: 'lompo', indonesia: 'besar', kategori: 'sifat' },
    { konjo: 'caddi', indonesia: 'kecil', kategori: 'sifat' },
    { konjo: 'garring', indonesia: 'sakit', kategori: 'sifat' },
    { konjo: 'hambang', indonesia: 'panas', kategori: 'sifat' },
    { konjo: 'malling', indonesia: 'lama', kategori: 'sifat' },
    { konjo: 'beru', indonesia: 'baru', kategori: 'sifat' },
    { konjo: 'lohe', indonesia: 'banyak', kategori: 'sifat' },
    { konjo: "le'leng", indonesia: 'hitam', kategori: 'sifat', keterangan: 'Warna hitam melambangkan kesederhanaan masyarakat adat Kajang.' },
    { konjo: 'toa', indonesia: 'tua', kategori: 'sifat' },

    // 5. Alam & Benda
    { konjo: 'allo', indonesia: 'hari', kategori: 'alam', keterangan: 'Juga bermakna matahari.' },
    { konjo: 'bulang', indonesia: 'bulan', kategori: 'alam' },
    { konjo: 'bosi', indonesia: 'hujan', kategori: 'alam' },
    { konjo: 'ere', indonesia: 'air', kategori: 'alam' },
    { konjo: 'butta', indonesia: 'tanah', kategori: 'alam' },
    { konjo: 'borong', indonesia: 'hutan', kategori: 'alam' },
    { konjo: "bulu'", indonesia: 'gunung', kategori: 'alam' },
    { konjo: 'tamparang', indonesia: 'laut', kategori: 'alam' },
    { konjo: "balla'", indonesia: 'rumah', kategori: 'alam' },
    { konjo: 'kampong', indonesia: 'kampung', kategori: 'alam' },
    { konjo: 'passapu', indonesia: 'destar', kategori: 'alam', sinonim: ['ikat kepala'], keterangan: 'Ikat kepala dari kain hitam, pakaian adat laki-laki Kajang.' },
    { konjo: 'tope', indonesia: 'sarung', kategori: 'alam', keterangan: 'Umumnya sarung tenun berwarna hitam.' },
    { konjo: "juku'", indonesia: 'ikan', kategori: 'alam' },

    // 6. Bilangan & Waktu
    { konjo: "se're", indonesia: 'satu', kategori: 'bilangan' },
    { konjo: 'rua', indonesia: 'dua', kategori: 'bilangan' },
    { konjo: 'tallu', indonesia: 'tiga', kategori: 'bilangan' },
    { konjo: "appa'", indonesia: 'empat', kategori: 'bilangan' },
    { konjo: 'lima', indonesia: 'lima', kategori: 'bilangan', keterangan: 'Juga bermakna tangan.' },
    { konjo: 'annang', indonesia: 'enam', kategori: 'bilangan' },
    { konjo: 'tuju', indonesia: 'tujuh', kategori: 'bilangan' },
    { konjo: 'karua', indonesia: 'delapan', kategori: 'bilangan' },
    { konjo: 'salapang', indonesia: 'sembilan', kategori: 'bilangan' },
    { konjo: 'sampulo', indonesia: 'sepuluh', kategori: 'bilangan' },
    { konjo: 'ammuko', indonesia: 'besok', kategori: 'bilangan', varian: ['muko'] },
    { konjo: "sikarie'", indonesia: 'kemarin', kategori: 'bilangan' }
  ];

  var FRASA = [
    { konjo: 'apa kareba', indonesia: 'apa kabar', kategori: 'frasa', keterangan: 'Salam pembuka ketika bertemu.' },
    { konjo: "tarima kasi'", indonesia: 'terima kasih', kategori: 'frasa', varian: ['tarima kasih'] },
    { konjo: 'amma toa', indonesia: 'pemimpin adat', kategori: 'frasa', varian: ['ammatoa'], keterangan: 'Ammatoa, orang yang dituakan dan pemimpin adat masyarakat Kajang; secara harfiah "bapak tua".' },
    { konjo: 'borong karamaka', indonesia: 'hutan keramat', kategori: 'frasa', keterangan: 'Hutan adat Kajang yang dilindungi oleh Pasang ri Kajang.' },
    { konjo: "tope le'leng", indonesia: 'sarung hitam', kategori: 'frasa', keterangan: 'Sarung tenun hitam khas masyarakat adat Kajang.' },
    { konjo: "tallasa' kamase-masea", indonesia: 'hidup sederhana', kategori: 'frasa', keterangan: 'Prinsip hidup bersahaja dalam ajaran Pasang ri Kajang.' }
  ];

  KATA.forEach(function (e) { e.jenis = 'kata'; });
  FRASA.forEach(function (e) { e.jenis = 'frasa'; });

  return {
    nama: 'Kamus PASSAPU',
    versi: '1.0',
    dialek: 'Kajang',
    kategori: KATEGORI,
    kata: KATA,
    frasa: FRASA,
    semua: KATA.concat(FRASA)
  };
});
