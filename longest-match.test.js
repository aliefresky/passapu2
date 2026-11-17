'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const LM = require('../js/longest-match.js');
const KAMUS = require('../js/dictionary.js');

const konjoKeIndonesia = LM.buildIndex(KAMUS.semua, 'konjo', 'indonesia');
const indonesiaKeKonjo = LM.buildIndex(KAMUS.semua, 'indonesia', 'konjo');

test('contoh pada dokumen: "Apa kareba, kau macca sikali."', () => {
  const hasil = LM.translate('Apa kareba, kau macca sikali.', konjoKeIndonesia);

  assert.equal(hasil.output, 'Apa kabar, kamu pintar sekali.');
  assert.equal(hasil.nMax, 2);
  assert.deepEqual(
    { dikenali: hasil.stats.dikenali, tidakDikenali: hasil.stats.tidakDikenali, frasa: hasil.stats.frasa },
    { dikenali: 5, tidakDikenali: 0, frasa: 1 }
  );
  assert.deepEqual(
    hasil.trace.slice(0, 3).map((t) => [t.posisi, t.n, t.kunci, t.ditemukan]),
    [
      [1, 2, 'apa kareba', true],
      [3, 2, 'kau macca', false],
      [3, 1, 'kau', true]
    ]
  );
});

test('kamus versi awal: 82 kata, 6 kategori, 6 frasa, n maks = 2', () => {
  const idKategori = KAMUS.kategori.map((k) => k.id);
  assert.equal(KAMUS.kata.length, 82);
  assert.equal(KAMUS.frasa.length, 6);
  assert.equal(idKategori.length, 6);
  assert.deepEqual([...new Set(KAMUS.kata.map((e) => e.kategori))].sort(), [...idKategori].sort());
  assert.equal(konjoKeIndonesia.nMax, 2);
});

test('setiap kunci Konjo unik setelah normalisasi', () => {
  const dilihat = new Map();
  KAMUS.semua.forEach((entri) => {
    [entri.konjo].concat(entri.varian || []).forEach((teks) => {
      const kunci = LM.keyOf(teks);
      assert.ok(!dilihat.has(kunci), `"${teks}" bentrok dengan "${dilihat.get(kunci)}"`);
      dilihat.set(kunci, teks);
    });
  });
});

test('frasa terpanjang diutamakan, tetapi tidak melewati tanda baca', () => {
  assert.equal(LM.translate('amma toa', konjoKeIndonesia).output, 'pemimpin adat');
  assert.equal(LM.translate('amma, toa', konjoKeIndonesia).output, 'bapak, tua');
});

test('normalisasi: huruf besar, apostrof, dan spasi berlebih', () => {
  assert.equal(LM.translate('TARIMA   KASI', konjoKeIndonesia).output, 'TERIMA KASIH');
  assert.equal(LM.translate('tarima kasi’', konjoKeIndonesia).output, 'terima kasih');
  assert.equal(LM.translate('Ikau', konjoKeIndonesia).output, 'Kamu');
});

test('kata yang tidak ada di kamus ditandai dan dibiarkan apa adanya', () => {
  const hasil = LM.translate('Inai arengnu?', konjoKeIndonesia);
  assert.equal(hasil.output, 'Siapa arengnu?');
  assert.deepEqual(hasil.segments.map((s) => s.kind), ['kata', 'tidak-ditemukan']);
  assert.equal(hasil.stats.tidakDikenali, 1);
  assert.equal(hasil.stats.cakupan, 50);
});

test('angka tidak dihitung sebagai kata yang tidak dikenali', () => {
  const hasil = LM.translate('rua 2', konjoKeIndonesia);
  assert.equal(hasil.output, 'dua 2');
  assert.equal(hasil.stats.angka, 1);
  assert.equal(hasil.stats.tidakDikenali, 0);
});

test('arah Indonesia → Konjo memakai indeks terbalik', () => {
  const hasil = LM.translate('Terima kasih, saya makan ikan.', indonesiaKeKonjo);
  assert.equal(hasil.output, "Tarima kasi', nakke angnganre juku'.");
});
