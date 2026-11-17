/*!
 * PASSAPU — Mesin penerjemah dengan algoritma Longest Match.
 *
 * Alur (sesuai flowchart sistem):
 *   Tahap 2  Normalisasi (huruf kecil, apostrof dihapus, spasi dirapikan)
 *            dan tokenisasi menjadi kata, spasi, dan tanda baca.
 *   Tahap 3  Penelusuran token kata mulai i = 1. Di setiap posisi, panjang
 *            pencocokan n diawali dari n maks (jumlah kata terpanjang pada
 *            entri kamus), lalu diturunkan satu per satu hingga n = 1.
 *            Kata tunggal yang tetap tidak ditemukan ditandai "tidak ditemukan".
 *   Tahap 4  Hasil pencocokan disusun menjadi kalimat terjemahan beserta
 *            jumlah kata yang dikenali dan tidak dikenali.
 *
 * Berkas ini dapat dipakai langsung di peramban (window.LongestMatch)
 * maupun di Node.js (require) untuk pengujian.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LongestMatch = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var APOSTROF = /['’‘ʼ`´]/g;
  // Kata boleh memuat apostrof (hamzah, mis. kasi', le'leng) dan tanda hubung (kamase-mase).
  var POLA_TOKEN = /([\p{L}\p{M}\p{N}]+(?:[-'’‘ʼ`´][\p{L}\p{M}\p{N}]+)*['’‘ʼ`´]?)|(\s+)|([^\s\p{L}\p{M}\p{N}])/gu;
  var POLA_ANGKA = /^\p{N}+$/u;

  function normalize(text) {
    return String(text == null ? '' : text)
      .toLowerCase()
      .replace(APOSTROF, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(text) {
    var tokens = [];
    var sumber = String(text == null ? '' : text);
    var m;
    POLA_TOKEN.lastIndex = 0;
    while ((m = POLA_TOKEN.exec(sumber)) !== null) {
      if (m[1]) {
        tokens.push({ type: 'word', text: m[1], norm: normalize(m[1]) });
      } else if (m[2]) {
        tokens.push({ type: 'space', text: m[2] });
      } else {
        tokens.push({ type: 'punct', text: m[3] });
      }
    }
    return tokens;
  }

  /** Kunci kamus: token kata yang sudah dinormalisasi, digabung satu spasi. */
  function keyOf(text) {
    return tokenize(text)
      .filter(function (t) { return t.type === 'word'; })
      .map(function (t) { return t.norm; })
      .join(' ');
  }

  /**
   * Membangun indeks pencarian dari entri kamus.
   * Kunci tambahan: `varian` (ejaan Konjo lain) untuk arah Konjo → Indonesia,
   * `sinonim` (padanan Indonesia lain) untuk arah Indonesia → Konjo.
   * @param {Array} entries  entri kamus ({ konjo, indonesia, ... })
   * @param {string} from    bahasa sumber: 'konjo' | 'indonesia'
   * @param {string} to      bahasa sasaran: 'indonesia' | 'konjo'
   */
  function buildIndex(entries, from, to) {
    from = from || 'konjo';
    to = to || 'indonesia';
    var map = new Map();
    var nMax = 1;
    (entries || []).forEach(function (entry) {
      var kunci = [entry[from]];
      var tambahan = from === 'konjo' ? entry.varian : entry.sinonim;
      if (Array.isArray(tambahan)) kunci = kunci.concat(tambahan);
      kunci.forEach(function (teks) {
        var key = keyOf(teks);
        if (!key) return;
        // Entri pertama diutamakan bila ada kunci yang sama.
        if (!map.has(key)) map.set(key, entry);
        var n = key.split(' ').length;
        if (n > nMax) nMax = n;
      });
    });
    return { map: map, nMax: nMax, from: from, to: to, size: map.size };
  }

  function huruf(teks) {
    return teks.replace(/[^\p{L}]/gu, '');
  }

  /** Menyesuaikan kapitalisasi padanan dengan teks sumber. */
  function matchCase(source, target) {
    if (!target) return target;
    var h = huruf(source);
    if (h.length > 1 && h === h.toUpperCase() && h !== h.toLowerCase()) {
      return target.toUpperCase();
    }
    var awal = h.charAt(0);
    if (awal && awal === awal.toUpperCase() && awal !== awal.toLowerCase()) {
      return target.charAt(0).toUpperCase() + target.slice(1);
    }
    return target;
  }

  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  function rapikanSpasi(teks) {
    var baris = (teks.match(/\n/g) || []).length;
    if (baris === 0) return ' ';
    return baris > 1 ? '\n\n' : '\n';
  }

  /**
   * Menerjemahkan teks dengan algoritma Longest Match.
   * @returns {{input, output, parts, segments, trace, stats, nMax, durationMs}}
   */
  function translate(text, index) {
    var mulai = now();
    var tokens = tokenize(text);
    var to = index.to;

    var kata = [];
    tokens.forEach(function (t, idx) { if (t.type === 'word') kata.push(idx); });

    // batas[w] = true bila ada tanda baca di antara kata ke-w dan kata ke-(w+1);
    // frasa tidak dicocokkan melewati tanda baca.
    var batas = kata.map(function (tokIdx, w) {
      if (w === kata.length - 1) return true;
      for (var k = tokIdx + 1; k < kata[w + 1]; k++) {
        if (tokens[k].type === 'punct') return true;
      }
      return false;
    });

    var segments = [];
    var trace = [];
    var i = 0;
    while (i < kata.length) {
      var nAwal = 1;
      while (nAwal < index.nMax && i + nAwal < kata.length && !batas[i + nAwal - 1]) nAwal++;

      var cocok = null;
      for (var n = nAwal; n >= 1; n--) {
        var bagian = [];
        for (var j = 0; j < n; j++) bagian.push(tokens[kata[i + j]].norm);
        var key = bagian.join(' ');
        var entry = index.map.get(key) || null;
        trace.push({
          posisi: i + 1,
          n: n,
          kunci: key,
          ditemukan: !!entry,
          padanan: entry ? entry[to] : null
        });
        if (entry) { cocok = { n: n, key: key, entry: entry }; break; }
      }

      var tokAwal = kata[i];
      var tokAkhir = kata[i + (cocok ? cocok.n : 1) - 1];
      var sumber = tokens.slice(tokAwal, tokAkhir + 1).map(function (t) {
        return t.type === 'space' ? ' ' : t.text;
      }).join('');

      if (cocok) {
        segments.push({
          kind: cocok.n > 1 ? 'frasa' : 'kata',
          source: sumber,
          key: cocok.key,
          target: matchCase(sumber, cocok.entry[to]),
          entry: cocok.entry,
          n: cocok.n,
          posisi: i + 1,
          tokenStart: tokAwal,
          tokenEnd: tokAkhir
        });
        i += cocok.n;
      } else {
        var tok = tokens[tokAwal];
        segments.push({
          kind: POLA_ANGKA.test(tok.norm) ? 'angka' : 'tidak-ditemukan',
          source: tok.text,
          key: tok.norm,
          target: tok.text,
          entry: null,
          n: 1,
          posisi: i + 1,
          tokenStart: tokAwal,
          tokenEnd: tokAwal
        });
        i += 1;
      }
    }

    // Tahap 4: susun kalimat terjemahan dengan mempertahankan tanda baca.
    var parts = [];
    var segAwal = {};
    segments.forEach(function (s) { segAwal[s.tokenStart] = s; });
    var t = 0;
    while (t < tokens.length) {
      var seg = segAwal[t];
      if (seg) {
        parts.push({ type: 'seg', seg: seg, text: seg.target });
        t = seg.tokenEnd + 1;
        continue;
      }
      var tk = tokens[t];
      parts.push({ type: 'text', text: tk.type === 'space' ? rapikanSpasi(tk.text) : tk.text });
      t++;
    }
    while (parts.length && parts[0].type === 'text' && !parts[0].text.trim()) parts.shift();
    while (parts.length && parts[parts.length - 1].type === 'text' && !parts[parts.length - 1].text.trim()) parts.pop();

    var stats = { kata: 0, dikenali: 0, tidakDikenali: 0, frasa: 0, angka: 0, cakupan: 0 };
    segments.forEach(function (s) {
      if (s.kind === 'angka') { stats.angka += 1; return; }
      stats.kata += s.n;
      if (s.kind === 'tidak-ditemukan') {
        stats.tidakDikenali += 1;
      } else {
        stats.dikenali += s.n;
        if (s.kind === 'frasa') stats.frasa += 1;
      }
    });
    stats.cakupan = stats.kata ? Math.round((stats.dikenali / stats.kata) * 100) : 0;

    return {
      input: String(text == null ? '' : text),
      output: parts.map(function (p) { return p.text; }).join(''),
      parts: parts,
      segments: segments,
      trace: trace,
      stats: stats,
      nMax: index.nMax,
      durationMs: now() - mulai
    };
  }

  return {
    normalize: normalize,
    tokenize: tokenize,
    keyOf: keyOf,
    buildIndex: buildIndex,
    matchCase: matchCase,
    translate: translate
  };
});
