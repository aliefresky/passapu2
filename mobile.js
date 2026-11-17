/*!
 * PASSAPU — perilaku tambahan untuk tampilan HP/Android.
 * Tidak mengubah app.js: hanya membaca tampilan aktif dari hash URL dan
 * memakai tombol radial yang sudah ada (#fab) untuk membuka menu.
 */
(function () {
  'use strict';

  const VIEWS = ['terjemah', 'bahasa', 'lokasi'];
  const IKON = { terjemah: '#i-translate', bahasa: '#i-book', lokasi: '#i-pin' };
  const $ = (sel) => document.querySelector(sel);

  const viewAktif = () => {
    const nama = (location.hash || '').replace('#', '');
    return VIEWS.includes(nama) ? nama : 'terjemah';
  };

  // Judul bilah atas dan label bilah bawah mengikuti tampilan yang aktif.
  function perbarui() {
    const nama = viewAktif();
    const judul = $(`#view-${nama} .view__title`);
    const label = $(`.radial__item[data-view="${nama}"] .radial__label b`);
    $('#mSection').textContent = judul ? judul.textContent : '';
    $('#mBarLabel').textContent = label ? label.textContent : '';
    $('#mBarIcon').setAttribute('href', IKON[nama]);
  }

  function keRiwayat() {
    const gulir = () => $('.history').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (viewAktif() === 'terjemah') {
      gulir();
    } else {
      location.hash = 'terjemah';
      // tunggu animasi pembukaan tampilan selesai
      setTimeout(gulir, 800);
    }
  }

  $('#mMenuBtn').addEventListener('click', () => $('#fab').click());
  $('#mHistoryBtn').addEventListener('click', keRiwayat);
  window.addEventListener('hashchange', perbarui);
  perbarui();
})();
