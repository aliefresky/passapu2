/*!
 * PASSAPU — antarmuka website (menu radial, penerjemah, kamus, lokasi).
 * Seluruh proses berjalan di sisi pengguna (client-side); riwayat dan
 * statistik penggunaan disimpan di localStorage peramban.
 */
(function () {
  'use strict';

  const KAMUS = window.KAMUS_PASSAPU;
  const LM = window.LongestMatch;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const gerakRendah = window.matchMedia('(prefers-reduced-motion: reduce)');

  const VIEWS = {
    terjemah: { label: 'Terjemah', judul: 'Terjemah Bahasa', perintah: 'terjemah --konjo-indonesia' },
    bahasa: { label: 'Bahasa', judul: 'Bahasa Konjo', perintah: 'bahasa --kamus --dialek kajang' },
    lokasi: { label: 'Lokasi', judul: 'Lokasi Kajang', perintah: 'lokasi --kecamatan kajang' }
  };

  const ARAH = {
    'konjo-indonesia': {
      from: 'konjo', to: 'indonesia', labelFrom: 'Konjo', labelTo: 'Indonesia',
      perintah: 'terjemah --konjo-indonesia', placeholder: 'Contoh: Apa kareba, kau macca sikali.'
    },
    'indonesia-konjo': {
      from: 'indonesia', to: 'konjo', labelFrom: 'Indonesia', labelTo: 'Konjo',
      perintah: 'terjemah --indonesia-konjo', placeholder: 'Contoh: Terima kasih, saya makan ikan.'
    }
  };

  const CONTOH = [
    'Apa kareba, kau macca sikali.',
    "Tarima kasi', nakke amminro ammuko.",
    "Ana' caddi angnganre juku' ri balla'.",
    "Amma toa a'cidong ri balla'.",
    'Inai arengnu?'
  ];

  const DESA = [
    ['Bonto Biraeng', 'Desa'], ['Bontorannu', 'Desa'], ['Lembang', 'Desa'], ['Lembanglohe', 'Desa'],
    ['Tanah Jaya', 'Kelurahan'], ['Laikang', 'Kelurahan'], ['Pantama', 'Desa'], ['Possi Tanah', 'Desa'],
    ['Lembanna', 'Desa'], ['Tambangan', 'Desa'], ['Sangkala', 'Desa'], ['Bonto Baji', 'Desa'],
    ['Pattiroang', 'Desa'], ['Sapanang', 'Desa'], ['Batunilamung', 'Desa'], ['Tanah Towa', 'Desa'],
    ['Malleleng', 'Desa'], ['Mattoanging', 'Desa'], ['Lolisang', 'Desa']
  ];
  const CATATAN_DESA = { 'Tanah Towa': 'Ammatoa', 'Possi Tanah': 'Badan Bahasa' };

  const KUNCI = { riwayat: 'passapu:riwayat', statistik: 'passapu:statistik', petunjuk: 'passapu:petunjuk' };
  const MAKS_RIWAYAT = 30;
  const MAKS_JEJAK = 240;
  const POLA_ANGKA = /^\p{N}+$/u;

  const indeks = {
    'konjo-indonesia': LM.buildIndex(KAMUS.semua, 'konjo', 'indonesia'),
    'indonesia-konjo': LM.buildIndex(KAMUS.semua, 'indonesia', 'konjo')
  };
  const namaKategori = { frasa: 'Frasa' };
  KAMUS.kategori.forEach((k) => { namaKategori[k.id] = k.nama; });

  const state = { view: null, arah: 'konjo-indonesia', hasil: null };

  /* ------------------------------------------------------------------ */
  /* Utilitas                                                            */
  /* ------------------------------------------------------------------ */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const store = {
    get(key, cadangan) {
      try {
        const nilai = localStorage.getItem(key);
        return nilai ? JSON.parse(nilai) : cadangan;
      } catch (e) {
        return cadangan;
      }
    },
    set(key, nilai) {
      try { localStorage.setItem(key, JSON.stringify(nilai)); } catch (e) { /* penyimpanan tidak tersedia */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* penyimpanan tidak tersedia */ }
    }
  };

  const dua = (n) => String(n).padStart(2, '0');

  function formatTanggal(ms) {
    const d = new Date(ms);
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()];
    return `${d.getDate()} ${bulan} ${d.getFullYear()}, ${dua(d.getHours())}:${dua(d.getMinutes())}`;
  }

  let timerToast;
  function toast(pesan) {
    const el = $('#toast');
    el.textContent = pesan;
    el.classList.add('is-show');
    clearTimeout(timerToast);
    timerToast = setTimeout(() => el.classList.remove('is-show'), 2200);
  }

  function ulangAnimasi(el, kelas) {
    el.classList.remove(kelas);
    void el.offsetWidth;
    el.classList.add(kelas);
  }

  /* ------------------------------------------------------------------ */
  /* Panel atas: jam dan perintah terminal                              */
  /* ------------------------------------------------------------------ */
  function mulaiJam() {
    const el = $('#clock');
    const tik = () => {
      const d = new Date();
      el.textContent = `${dua(d.getHours())}:${dua(d.getMinutes())}`;
      el.dateTime = d.toISOString();
    };
    tik();
    setInterval(tik, 10000);
  }

  let timerKetik;
  function ketikPerintah(teks) {
    const el = $('#promptCmd');
    if (!el) return;
    clearTimeout(timerKetik);
    if (gerakRendah.matches) { el.textContent = teks; return; }
    const awal = el.textContent;
    let sama = 0;
    while (sama < awal.length && sama < teks.length && awal[sama] === teks[sama]) sama++;
    const tulis = () => {
      const n = el.textContent.length;
      if (n < teks.length) {
        el.textContent = teks.slice(0, n + 1);
        timerKetik = setTimeout(tulis, 28 + Math.random() * 34);
      }
    };
    const hapus = () => {
      if (el.textContent.length > sama) {
        el.textContent = el.textContent.slice(0, -1);
        timerKetik = setTimeout(hapus, 14);
      } else {
        timerKetik = setTimeout(tulis, 140);
      }
    };
    hapus();
  }

  /* ------------------------------------------------------------------ */
  /* Menu radial                                                         */
  /* ------------------------------------------------------------------ */
  const radial = $('#radial');
  const fab = $('#fab');
  const scrim = $('#scrim');
  const butirMenu = $$('.radial__item');
  const petunjuk = $('#radialHint');

  const menuTerbuka = () => radial.classList.contains('is-open');

  function sembunyikanPetunjuk() {
    if (!petunjuk.hidden) {
      petunjuk.hidden = true;
      store.set(KUNCI.petunjuk, true);
    }
  }

  function bukaMenu() {
    if (menuTerbuka()) return;
    const r = fab.getBoundingClientRect();
    scrim.style.setProperty('--sx', `${r.left + r.width / 2}px`);
    scrim.style.setProperty('--sy', `${r.top + r.height / 2}px`);
    radial.classList.add('is-open');
    document.body.classList.add('is-menu-open');
    fab.setAttribute('aria-expanded', 'true');
    fab.setAttribute('aria-label', 'Tutup menu radial');
    butirMenu.forEach((a) => { a.tabIndex = 0; });
    sembunyikanPetunjuk();
    const aktif = butirMenu.find((a) => a.dataset.view === state.view) || butirMenu[0];
    setTimeout(() => { if (menuTerbuka()) aktif.focus({ preventScroll: true }); }, 160);
  }

  function tutupMenu(kembalikanFokus) {
    if (!menuTerbuka()) return;
    radial.classList.remove('is-open');
    document.body.classList.remove('is-menu-open');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-label', 'Buka menu radial');
    butirMenu.forEach((a) => { a.tabIndex = -1; });
    if (kembalikanFokus) fab.focus({ preventScroll: true });
  }

  const alihkanMenu = () => (menuTerbuka() ? tutupMenu(true) : bukaMenu());

  function pilihView(nama) {
    tutupMenu(false);
    if (location.hash === `#${nama}`) tampilkanView(nama);
    else location.hash = nama;
  }

  function siapkanMenu() {
    if (store.get(KUNCI.petunjuk, false)) petunjuk.hidden = true;

    fab.addEventListener('click', alihkanMenu);
    $('#activitiesBtn').addEventListener('click', bukaMenu);
    $('.dock__status').addEventListener('click', bukaMenu);
    scrim.addEventListener('click', () => tutupMenu(false));

    butirMenu.forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        pilihView(a.dataset.view);
      });
    });

    radial.addEventListener('keydown', (e) => {
      if (!menuTerbuka()) return;
      const urutan = [fab].concat(butirMenu);
      const posisi = urutan.indexOf(document.activeElement);
      const geser = (langkah) => {
        e.preventDefault();
        const i = butirMenu.indexOf(document.activeElement);
        butirMenu[(i + langkah + butirMenu.length) % butirMenu.length].focus();
      };
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') geser(1);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') geser(-1);
      else if (e.key === 'Tab') {
        // Fokus berputar di dalam menu selama menu terbuka.
        e.preventDefault();
        const berikut = (posisi + (e.shiftKey ? -1 : 1) + urutan.length) % urutan.length;
        urutan[berikut].focus();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuTerbuka()) {
        e.preventDefault();
        tutupMenu(true);
        return;
      }
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        alihkanMenu();
      } else if (menuTerbuka() && /^[1-3]$/.test(e.key)) {
        e.preventDefault();
        pilihView(butirMenu[Number(e.key) - 1].dataset.view);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Navigasi tampilan (hash: #terjemah, #bahasa, #lokasi)               */
  /* ------------------------------------------------------------------ */
  const viewDariHash = () => {
    const nama = (location.hash || '').replace('#', '');
    return VIEWS[nama] ? nama : 'terjemah';
  };

  function bukaMelingkar(view) {
    const f = fab.getBoundingClientRect();
    const v = view.getBoundingClientRect();
    const ox = f.left + f.width / 2 - v.left;
    const oy = f.top + f.height / 2 - v.top;
    const r = Math.max(
      Math.hypot(ox, oy), Math.hypot(v.width - ox, oy),
      Math.hypot(ox, v.height - oy), Math.hypot(v.width - ox, v.height - oy)
    );
    view.style.setProperty('--ox', `${ox}px`);
    view.style.setProperty('--oy', `${oy}px`);
    view.style.setProperty('--r', `${Math.ceil(r)}px`);
    ulangAnimasi(view, 'is-entering');
  }

  function tampilkanView(nama) {
    const pertama = state.view === null;
    if (state.view === nama) return;
    state.view = nama;

    $$('.view').forEach((v) => {
      v.hidden = v.dataset.view !== nama;
      v.classList.remove('is-entering');
    });
    const view = $(`#view-${nama}`);

    if (!pertama) {
      const atasJendela = $('#appWindow').getBoundingClientRect().top;
      if (atasJendela < 0) window.scrollTo({ top: window.scrollY + atasJendela - 48, behavior: 'auto' });
    }
    if (!gerakRendah.matches) bukaMelingkar(view);

    butirMenu.forEach((a) => {
      const aktif = a.dataset.view === nama;
      a.classList.toggle('is-active', aktif);
      if (aktif) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    $$('.dock__pips i').forEach((i) => i.classList.toggle('is-active', i.dataset.view === nama));
    $('#dockLabel').textContent = VIEWS[nama].label;
    $('#urlPath').textContent = nama;
    document.title = `${VIEWS[nama].judul} · PASSAPU`;
    ketikPerintah(nama === 'terjemah' ? ARAH[state.arah].perintah : VIEWS[nama].perintah);
    if (nama === 'lokasi') muatPeta();
  }

  function siapkanNavigasi() {
    $$('.view').forEach((v) => {
      v.addEventListener('animationend', (e) => {
        // Hapus clip-path setelah animasi agar konten yang bertambah tidak terpotong.
        if (e.target === v) v.classList.remove('is-entering');
      });
    });
    window.addEventListener('hashchange', () => tampilkanView(viewDariHash()));
  }

  /* ------------------------------------------------------------------ */
  /* Penerjemah (Tahap 1–5 pada flowchart)                               */
  /* ------------------------------------------------------------------ */
  const masukan = $('#inputText');
  const keluaran = $('#outputText');
  const tombolSalin = $('#copyBtn');
  const daftarHilang = $('#missingList');

  function perbaruiHitungan() {
    $('#charCount').textContent = `${masukan.value.length} / ${masukan.maxLength}`;
  }

  function terjemahkan(simpan, animasi) {
    perbaruiHitungan();
    if (!masukan.value.trim()) {
      state.hasil = null;
      renderKosong();
      return null;
    }
    const hasil = LM.translate(masukan.value, indeks[state.arah]);
    hasil.arah = state.arah;
    state.hasil = hasil;
    renderKeluaran(hasil, animasi);
    renderStatistik(hasil);
    renderRincian(hasil);
    renderJejak(hasil, animasi);
    if (simpan) simpanRiwayat(hasil);
    return hasil;
  }

  function renderKosong() {
    keluaran.classList.remove('output--animate');
    keluaran.innerHTML = '<span class="output__placeholder">Hasil terjemahan akan tampil di sini.</span>';
    daftarHilang.hidden = true;
    tombolSalin.disabled = true;
    renderStatistik(null);
    renderRincian(null);
    renderJejak(null);
  }

  function renderKeluaran(hasil, animasi) {
    keluaran.textContent = '';
    keluaran.classList.toggle('output--animate', Boolean(animasi) && !gerakRendah.matches);
    let k = 0;
    hasil.parts.forEach((p) => {
      if (p.type === 'text') {
        keluaran.appendChild(document.createTextNode(p.text));
        return;
      }
      const s = p.seg;
      const span = document.createElement('span');
      span.className = `tok tok--${s.kind === 'tidak-ditemukan' ? 'miss' : s.kind}`;
      span.textContent = p.text;
      span.style.setProperty('--k', String(k++));
      if (s.kind === 'tidak-ditemukan') span.dataset.tip = `“${s.source}” tidak ditemukan`;
      else if (s.kind === 'angka') span.dataset.tip = 'angka (dilewati)';
      else span.dataset.tip = `${s.source} → ${s.target}${s.kind === 'frasa' ? ' · frasa' : ''}`;
      keluaran.appendChild(span);
    });

    const hilang = [...new Set(hasil.segments.filter((s) => s.kind === 'tidak-ditemukan').map((s) => s.source))];
    daftarHilang.hidden = hilang.length === 0;
    daftarHilang.innerHTML = hilang.length
      ? `<span>Tidak ditemukan:</span>${hilang.map((w) => `<span class="missing__chip">${esc(w)}</span>`).join('')}`
      : '';
    tombolSalin.disabled = false;
  }

  function setStat(id, nilai) {
    const el = $(id);
    const teks = String(nilai);
    if (el.textContent === teks) return;
    el.textContent = teks;
    ulangAnimasi(el.closest('.stat'), 'is-bump');
  }

  function renderStatistik(hasil) {
    const st = hasil ? hasil.stats : { dikenali: 0, tidakDikenali: 0, frasa: 0, cakupan: 0 };
    setStat('#sDikenali', st.dikenali);
    setStat('#sTidak', st.tidakDikenali);
    setStat('#sFrasa', st.frasa);
    setStat('#sCakupan', `${st.cakupan}%`);
    const ms = hasil ? hasil.durationMs : 0;
    $('#sWaktu').textContent = `${ms < 10 ? ms.toFixed(2) : ms.toFixed(1)} ms`;
  }

  function renderRincian(hasil) {
    const tubuh = $('#detailBody');
    if (!hasil || !hasil.segments.length) {
      tubuh.innerHTML = '<tr class="detail__empty"><td colspan="6">Belum ada teks yang diterjemahkan.</td></tr>';
      return;
    }
    const ke = ARAH[hasil.arah].to;
    tubuh.innerHTML = hasil.segments.map((s, i) => {
      const hilang = s.kind === 'tidak-ditemukan';
      let jenis = '<span class="badge">Kata</span>';
      let status = '<span class="badge badge--ok">Ditemukan</span>';
      if (s.kind === 'frasa') jenis = `<span class="badge badge--frasa">Frasa · ${s.n} kata</span>`;
      if (s.kind === 'angka') { jenis = '<span class="badge">Angka</span>'; status = '<span class="badge">Dilewati</span>'; }
      if (hilang) { jenis = '<span class="badge">—</span>'; status = '<span class="badge badge--miss">Tidak ditemukan</span>'; }
      const padanan = s.entry ? esc(s.entry[ke]) : (hilang ? '<span class="text-miss">tidak ditemukan</span>' : esc(s.target));
      const catatan = s.entry && s.entry.keterangan ? `<span class="detail__note">${esc(s.entry.keterangan)}</span>` : '';
      const kategori = s.entry ? esc(namaKategori[s.entry.kategori] || '—') : '—';
      return `<tr class="${hilang ? 'is-miss' : ''}"><td data-label="No">${i + 1}</td><td class="detail__src" data-label="Sumber">${esc(s.source)}</td>`
        + `<td data-label="Padanan">${padanan}${catatan}</td><td data-label="Jenis">${jenis}</td><td data-label="Kategori">${kategori}</td><td data-label="Status">${status}</td></tr>`;
    }).join('');
  }

  function renderJejak(hasil, animasi) {
    const daftar = $('#traceList');
    daftar.classList.toggle('trace--animate', Boolean(animasi) && !gerakRendah.matches);
    if (!hasil || !hasil.trace.length) {
      daftar.innerHTML = '<li class="trace__empty">Langkah pencocokan akan tampil di sini.</li>';
      return;
    }
    // Kelompokkan percobaan per posisi i: n maks → … → 1.
    const kelompok = [];
    hasil.trace.forEach((t) => {
      const akhir = kelompok[kelompok.length - 1];
      if (akhir && akhir.posisi === t.posisi) akhir.coba.push(t);
      else kelompok.push({ posisi: t.posisi, coba: [t] });
    });

    const baris = kelompok.slice(0, MAKS_JEJAK).map((g, k) => {
      const terakhir = g.coba[g.coba.length - 1];
      const angka = !terakhir.ditemukan && POLA_ANGKA.test(terakhir.kunci);
      const rantai = g.coba.map((t) => {
        const kelas = t.ditemukan ? 'is-hit' : (t === terakhir && !angka ? 'is-final' : 'is-miss');
        return `<span class="trace__try ${kelas}"><b>n=${t.n}</b> “${esc(t.kunci)}” ${t.ditemukan ? '✓' : '✗'}</span>`;
      }).join('<span class="trace__arrow" aria-hidden="true">→</span>');

      let kelas = 'is-final';
      let hasilPosisi = '<span class="trace__res trace__res--final">tidak ditemukan · geser 1</span>';
      if (terakhir.ditemukan) {
        kelas = 'is-hit';
        hasilPosisi = `<span class="trace__res trace__res--hit">${esc(terakhir.padanan)} · geser ${terakhir.n}</span>`;
      } else if (angka) {
        kelas = '';
        hasilPosisi = '<span class="trace__res">angka · dilewati</span>';
      }
      return `<li class="trace__group ${kelas}" style="--k:${Math.min(k, 30)}"><span class="trace__pos">i = ${g.posisi}</span>`
        + `<span class="trace__chain">${rantai}</span>${hasilPosisi}</li>`;
    });
    if (kelompok.length > MAKS_JEJAK) {
      baris.push(`<li class="trace__more">… ${kelompok.length - MAKS_JEJAK} posisi lainnya</li>`);
    }
    daftar.innerHTML = baris.join('');
  }

  async function salinHasil() {
    if (!state.hasil) return;
    const teks = state.hasil.output;
    try {
      await navigator.clipboard.writeText(teks);
      toast('Terjemahan disalin ke papan klip');
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = teks;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy');
        toast('Terjemahan disalin ke papan klip');
      } catch (err) {
        toast('Gagal menyalin teks');
      }
      area.remove();
    }
  }

  function aturArah(arah, pindahkanHasil) {
    const a = ARAH[arah];
    const keluaranSebelumnya = state.hasil ? state.hasil.output : '';
    state.arah = arah;
    const label = (bahasa) => (bahasa === 'konjo' ? 'Konjo <small>Kajang</small>' : 'Indonesia');
    $('#langFrom').innerHTML = label(a.from);
    $('#langTo').innerHTML = label(a.to);
    $('#labelFrom').textContent = a.labelFrom;
    $('#labelTo').textContent = a.labelTo;
    masukan.placeholder = a.placeholder;
    $('#swapBtn').classList.toggle('is-flipped', arah !== 'konjo-indonesia');
    if (pindahkanHasil && keluaranSebelumnya) masukan.value = keluaranSebelumnya;
    if (state.view === 'terjemah') ketikPerintah(a.perintah);
    terjemahkan(false, true);
  }

  function siapkanPenerjemah() {
    const wadahContoh = $('#examples');
    CONTOH.forEach((teks) => {
      const tombol = document.createElement('button');
      tombol.type = 'button';
      tombol.className = 'chip';
      tombol.textContent = teks;
      tombol.addEventListener('click', () => {
        if (state.arah !== 'konjo-indonesia') aturArah('konjo-indonesia', false);
        masukan.value = teks;
        terjemahkan(true, true);
      });
      wadahContoh.appendChild(tombol);
    });

    let tunda;
    masukan.addEventListener('input', () => {
      perbaruiHitungan();
      clearTimeout(tunda);
      tunda = setTimeout(() => terjemahkan(false, false), 160);
    });
    masukan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        clearTimeout(tunda);
        terjemahkan(true, true);
      }
    });
    $('#translateBtn').addEventListener('click', () => {
      clearTimeout(tunda);
      if (!terjemahkan(true, true)) {
        masukan.focus();
        toast('Ketik kata atau kalimat terlebih dahulu');
      }
    });
    $('#clearBtn').addEventListener('click', () => {
      masukan.value = '';
      terjemahkan(false, false);
      masukan.focus();
    });
    $('#swapBtn').addEventListener('click', () => {
      aturArah(state.arah === 'konjo-indonesia' ? 'indonesia-konjo' : 'konjo-indonesia', true);
    });
    tombolSalin.addEventListener('click', salinHasil);
  }

  /* ------------------------------------------------------------------ */
  /* Riwayat & statistik penggunaan (localStorage)                       */
  /* ------------------------------------------------------------------ */
  const statistikKosong = () => ({ terjemahan: 0, kata: 0, dikenali: 0, tidakDikenali: 0, sering: {}, belumAda: {} });

  function simpanRiwayat(hasil) {
    const daftar = store.get(KUNCI.riwayat, []);
    const butir = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      waktu: Date.now(),
      arah: hasil.arah,
      input: hasil.input.trim(),
      output: hasil.output,
      stats: {
        dikenali: hasil.stats.dikenali,
        tidakDikenali: hasil.stats.tidakDikenali,
        frasa: hasil.stats.frasa,
        cakupan: hasil.stats.cakupan
      }
    };
    const ulangan = daftar[0] && daftar[0].input === butir.input && daftar[0].arah === butir.arah;
    if (ulangan) {
      daftar[0] = butir;
    } else {
      daftar.unshift(butir);
      const st = Object.assign(statistikKosong(), store.get(KUNCI.statistik, {}));
      st.terjemahan += 1;
      st.kata += hasil.stats.kata;
      st.dikenali += hasil.stats.dikenali;
      st.tidakDikenali += hasil.stats.tidakDikenali;
      hasil.segments.forEach((s) => {
        if (s.entry) {
          const kunci = `${s.entry.konjo} → ${s.entry.indonesia}`;
          st.sering[kunci] = (st.sering[kunci] || 0) + 1;
        } else if (s.kind === 'tidak-ditemukan') {
          st.belumAda[s.key] = (st.belumAda[s.key] || 0) + 1;
        }
      });
      store.set(KUNCI.statistik, st);
    }
    store.set(KUNCI.riwayat, daftar.slice(0, MAKS_RIWAYAT));
    renderRiwayat();
  }

  function teratas(objek, n) {
    return Object.entries(objek).sort((a, b) => b[1] - a[1]).slice(0, n);
  }

  function renderRiwayat() {
    const daftar = store.get(KUNCI.riwayat, []);
    const st = Object.assign(statistikKosong(), store.get(KUNCI.statistik, {}));
    const persen = st.kata ? Math.round((st.dikenali / st.kata) * 100) : 0;
    const tag = (pasangan, kelas) => (pasangan.length
      ? pasangan.map(([k, n]) => `<span class="tag ${kelas}">${esc(k)} <b>${n}×</b></span>`).join('')
      : '<span class="usage__none">Belum ada data</span>');

    $('#usage').innerHTML = `
      <div class="usage__item"><span class="usage__value">${st.terjemahan}</span><span class="usage__label">terjemahan tersimpan</span></div>
      <div class="usage__item"><span class="usage__value">${st.kata}</span><span class="usage__label">kata diproses</span></div>
      <div class="usage__item"><span class="usage__value">${persen}%</span><span class="usage__label">kata dikenali</span></div>
      <div class="usage__item"><span class="usage__value">${st.tidakDikenali}</span><span class="usage__label">kata tidak dikenali</span></div>
      <div class="usage__item usage__item--wide"><span class="usage__label">Kata/frasa paling sering diterjemahkan</span><div class="taglist">${tag(teratas(st.sering, 6), '')}</div></div>
      <div class="usage__item usage__item--wide"><span class="usage__label">Kandidat entri kamus baru (belum tersedia)</span><div class="taglist">${tag(teratas(st.belumAda, 6), 'tag--miss')}</div></div>`;

    const wadah = $('#historyList');
    $('#clearHistoryBtn').disabled = daftar.length === 0 && st.terjemahan === 0;
    if (!daftar.length) {
      wadah.innerHTML = '<li class="history__empty">Belum ada riwayat. Tekan <b>Terjemahkan</b> untuk menyimpan hasil.</li>';
      return;
    }
    wadah.innerHTML = daftar.map((b) => {
      const a = ARAH[b.arah] || ARAH['konjo-indonesia'];
      return `<li class="history__item" data-id="${esc(b.id)}">
        <div>
          <div class="history__meta"><span class="badge">${a.labelFrom} → ${a.labelTo}</span><time>${formatTanggal(b.waktu)}</time><span>${b.stats.dikenali} dikenali · ${b.stats.tidakDikenali} tidak</span></div>
          <p class="history__text history__src">${esc(b.input)}</p>
          <p class="history__text history__dst">${esc(b.output)}</p>
        </div>
        <div class="history__actions">
          <button class="icon-btn" type="button" data-aksi="pakai" title="Terjemahkan lagi" aria-label="Terjemahkan lagi"><svg class="icon"><use href="#i-redo"/></svg></button>
          <button class="icon-btn" type="button" data-aksi="hapus" title="Hapus dari riwayat" aria-label="Hapus dari riwayat"><svg class="icon"><use href="#i-trash"/></svg></button>
        </div>
      </li>`;
    }).join('');
  }

  function siapkanRiwayat() {
    $('#historyList').addEventListener('click', (e) => {
      const tombol = e.target.closest('button[data-aksi]');
      if (!tombol) return;
      const id = tombol.closest('.history__item').dataset.id;
      const daftar = store.get(KUNCI.riwayat, []);
      const butir = daftar.find((b) => b.id === id);
      if (!butir) return;
      if (tombol.dataset.aksi === 'hapus') {
        store.set(KUNCI.riwayat, daftar.filter((b) => b.id !== id));
        renderRiwayat();
        return;
      }
      if (butir.arah !== state.arah) aturArah(butir.arah, false);
      masukan.value = butir.input;
      terjemahkan(false, true);
      $('#appWindow').scrollIntoView({ behavior: gerakRendah.matches ? 'auto' : 'smooth', block: 'start' });
    });
    $('#clearHistoryBtn').addEventListener('click', () => {
      if (!window.confirm('Hapus semua riwayat dan statistik penggunaan?')) return;
      store.remove(KUNCI.riwayat);
      store.remove(KUNCI.statistik);
      renderRiwayat();
      toast('Riwayat dan statistik dihapus');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Kamus (tampilan Bahasa)                                             */
  /* ------------------------------------------------------------------ */
  const kamus = { filter: 'semua', cari: '' };

  function sorot(teks, kueri) {
    const aman = esc(teks);
    if (!kueri) return aman;
    const i = teks.toLowerCase().indexOf(kueri);
    if (i < 0) return aman;
    return esc(teks.slice(0, i)) + `<mark>${esc(teks.slice(i, i + kueri.length))}</mark>` + esc(teks.slice(i + kueri.length));
  }

  function renderKamus() {
    const kueri = LM.normalize(kamus.cari);
    const cocok = KAMUS.semua.filter((e) => {
      if (kamus.filter !== 'semua' && e.kategori !== kamus.filter) return false;
      if (!kueri) return true;
      return [e.konjo, e.indonesia].concat(e.varian || [], e.sinonim || [])
        .some((t) => LM.normalize(t).includes(kueri));
    });
    const kueriTampil = kamus.cari.trim().toLowerCase();
    $('#kamusGrid').innerHTML = cocok.map((e, k) => `
      <button type="button" class="entry${e.jenis === 'frasa' ? ' entry--frasa' : ''}" data-konjo="${esc(e.konjo)}" style="--k:${k}" title="${esc(e.keterangan || 'Klik untuk menerjemahkan')}">
        <span class="entry__konjo">${sorot(e.konjo, kueriTampil)}</span>
        <span class="entry__indo">${sorot(e.indonesia, kueriTampil)}</span>
        <span class="entry__meta"><span>${esc(namaKategori[e.kategori])}</span><span class="entry__go">Coba<svg class="icon"><use href="#i-arrow"/></svg></span></span>
      </button>`).join('');
    $('#kamusEmpty').hidden = cocok.length > 0;
  }

  function siapkanKamus() {
    const nMaks = indeks['konjo-indonesia'].nMax;
    $('#kamusSummary').textContent = `${KAMUS.kata.length} kata dalam ${KAMUS.kategori.length} kategori dan ${KAMUS.frasa.length} frasa · n maks = ${nMaks}`;
    $('#statKata').textContent = KAMUS.kata.length;
    $('#statKategori').textContent = KAMUS.kategori.length;
    $('#statFrasa').textContent = KAMUS.frasa.length;
    $('#statNmax').textContent = nMaks;

    const filter = [{ id: 'semua', nama: 'Semua', n: KAMUS.semua.length }]
      .concat(KAMUS.kategori.map((k) => ({ id: k.id, nama: k.nama, n: KAMUS.kata.filter((e) => e.kategori === k.id).length })))
      .concat([{ id: 'frasa', nama: 'Frasa', n: KAMUS.frasa.length }]);
    const wadah = $('#kamusFilter');
    wadah.innerHTML = filter.map((f) => `<button type="button" class="chip${f.id === kamus.filter ? ' is-active' : ''}" data-filter="${f.id}" aria-pressed="${f.id === kamus.filter}">${esc(f.nama)} <span class="chip__count">${f.n}</span></button>`).join('');
    wadah.addEventListener('click', (e) => {
      const tombol = e.target.closest('[data-filter]');
      if (!tombol) return;
      kamus.filter = tombol.dataset.filter;
      $$('[data-filter]', wadah).forEach((b) => {
        const aktif = b === tombol;
        b.classList.toggle('is-active', aktif);
        b.setAttribute('aria-pressed', String(aktif));
      });
      renderKamus();
    });

    let tunda;
    $('#kamusSearch').addEventListener('input', (e) => {
      clearTimeout(tunda);
      tunda = setTimeout(() => { kamus.cari = e.target.value; renderKamus(); }, 120);
    });

    $('#kamusGrid').addEventListener('click', (e) => {
      const kartu = e.target.closest('.entry');
      if (!kartu) return;
      if (state.arah !== 'konjo-indonesia') aturArah('konjo-indonesia', false);
      masukan.value = kartu.dataset.konjo;
      pilihView('terjemah');
      terjemahkan(false, true);
    });

    renderKamus();
  }

  /* ------------------------------------------------------------------ */
  /* Lokasi (Google Maps Embed)                                          */
  /* ------------------------------------------------------------------ */
  let petaDimuat = false;

  function setPeta(kueri, zoom, label) {
    const frame = $('#mapFrame');
    frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(kueri)}&z=${zoom}&t=&ie=UTF8&iwloc=&output=embed`;
    frame.title = `Peta ${label}`;
    $('#mapLink').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kueri)}`;
    $('#mapLabel').textContent = label;
  }

  function muatPeta() {
    if (petaDimuat) return;
    petaDimuat = true;
    const tab = $('#mapTabs .tab.is-active');
    setPeta(tab.dataset.q, tab.dataset.z, tab.dataset.label);
  }

  function tandaiPilihanPeta(el) {
    $$('#mapTabs .tab, #desaList .chip').forEach((b) => {
      b.classList.toggle('is-active', b === el);
      b.setAttribute('aria-pressed', String(b === el));
    });
  }

  function siapkanLokasi() {
    $('#desaList').innerHTML = DESA.map(([nama, jenis]) => {
      const catatan = CATATAN_DESA[nama] ? ` <span class="chip__badge">${CATATAN_DESA[nama]}</span>` : '';
      return `<button type="button" class="chip" data-desa="${esc(nama)}" data-jenis="${jenis}" aria-pressed="false" title="${jenis} ${esc(nama)}">${esc(nama)}${catatan}</button>`;
    }).join('');

    $('#mapTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      tandaiPilihanPeta(tab);
      setPeta(tab.dataset.q, tab.dataset.z, tab.dataset.label);
    });

    $('#desaList').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-desa]');
      if (!chip) return;
      const { desa, jenis } = chip.dataset;
      tandaiPilihanPeta(chip);
      setPeta(`${jenis} ${desa}, Kajang, Bulukumba, Sulawesi Selatan`, 14, `${jenis} ${desa}, Kecamatan Kajang`);
      $('.map-card').scrollIntoView({ behavior: gerakRendah.matches ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Logo: tampilkan penanda "LOGO" bila assets/logo.png gagal dimuat     */
  /* ------------------------------------------------------------------ */
  function siapkanLogo() {
    $$('.logo__img').forEach((img) => {
      const kosong = () => img.closest('.logo').classList.add('is-empty');
      if (img.complete && img.naturalWidth === 0) kosong();
      else img.addEventListener('error', kosong);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Mulai                                                               */
  /* ------------------------------------------------------------------ */
  function mulai() {
    $('#urlHost').textContent = location.host || 'passapu.vercel.app';
    siapkanLogo();
    mulaiJam();
    siapkanMenu();
    siapkanNavigasi();
    siapkanPenerjemah();
    siapkanRiwayat();
    siapkanKamus();
    siapkanLokasi();
    renderRiwayat();
    aturArah('konjo-indonesia', false);
    tampilkanView(viewDariHash());
  }

  mulai();
})();
