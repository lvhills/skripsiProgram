// Fungsi bantu yang dipakai di beberapa komponen

export const WARNA_SEGMEN = ["#6FA8C7", "#7FAF6E", "#A987C0", "#D9A648", "#5FB39A"]

export function warnaSegmen(idx) {
  return WARNA_SEGMEN[Math.max(idx ?? 0, 0) % WARNA_SEGMEN.length]
}

export function formatRupiah(angka) {
  return "Rp" + Number(angka || 0).toLocaleString("id-ID")
}

export function inisialMerek(brand) {
  return brand?.slice(0, 2).toUpperCase()
}

// Opsi dropdown kategori dari /kategori: "Toner (450)"
export function opsiKategori(kategoriList) {
  return kategoriList.map(k => ({ value: k.category, label: `${k.category} (${k.jumlah})` }))
}

// Opsi dropdown dari daftar teks biasa
export function opsiTeks(list) {
  return list.map(t => ({ value: t, label: t }))
}
