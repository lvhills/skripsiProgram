import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { getCategories, getOptions, cariKatalog, katalogPerKategori } from "../api"
import KartuProduk from "../components/KartuProduk"
import DetailProduk from "../components/DetailProduk"
import Dropdown from "../components/Dropdown"
import IkonCari from "../components/IkonCari"
import { opsiKategori, opsiTeks } from "../utils"

const PER_HALAMAN = 12
const BATAS_HASIL = 120 // batas jumlah hasil dari backend (cari_katalog limit)
const PESAN_GAGAL = "Gagal memuat produk. Pastikan server backend berjalan."

function Katalog() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // pencarian & filter
  const [keyword, setKeyword] = useState("")
  const [kategoriList, setKategoriList] = useState([])
  const [kategori, setKategori] = useState("")
  const [merekList, setMerekList] = useState([])
  const [merek, setMerek] = useState([])
  const [hargaMin, setHargaMin] = useState("")
  const [hargaMax, setHargaMax] = useState("")
  const [bukaFilter, setBukaFilter] = useState(false)

  // data & tampilan
  const [perKategori, setPerKategori] = useState(null)
  const [hasil, setHasil] = useState(null)
  const [halaman, setHalaman] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    getCategories().then(setKategoriList)
    getOptions().then(data => setMerekList(data.merek || []))
    katalogPerKategori().then(setPerKategori).catch(() => setError(PESAN_GAGAL))
  }, [])

  // Dari Beranda: /katalog?kategori=<nama> langsung menampilkan kategori itu
  useEffect(() => {
    const kat = searchParams.get("kategori")
    if (!kat) return
    cariKatalog("", kat).then(data => {
      setKategori(kat)
      setHasil(data)
      setHalaman(1)
    }).catch(() => setError(PESAN_GAGAL))
  }, [searchParams])

  // kat/mrk bisa dioper langsung (mis. dari "Lihat semua") karena setState belum berlaku di render ini
  async function cari(kat = kategori, mrk = merek) {
    const min = Number(hargaMin) || 0
    const max = Number(hargaMax) || 0
    if (min < 0 || max < 0) { setError("Harga tidak boleh negatif."); return }
    if (max > 0 && min > max) { setError("Harga minimum tidak boleh lebih besar dari harga maksimum."); return }
    setError("")
    setLoading(true)
    try {
      setHasil(await cariKatalog(keyword, kat, min, max, mrk))
      setHalaman(1)
      setBukaFilter(false)
    } catch {
      setError(PESAN_GAGAL)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setKeyword("")
    setKategori("")
    setMerek([])
    setHargaMin("")
    setHargaMax("")
    setHasil(null)
    setError("")
  }

  function lihatSemua(kat) {
    setKategori(kat)
    cari(kat)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function hapusKategori() {
    setKategori("")
    cari("")
  }

  function hapusMerek(m) {
    const sisa = merek.filter(x => x !== m)
    setMerek(sisa)
    cari(kategori, sisa)
  }

  function keRekomendasi(prod) {
    navigate(`/rekomendasi?acuan=${prod.product_id}`)
  }

  function daftarKartu(produkList) {
    return produkList.map(p => (
      <KartuProduk key={p.product_id} produk={p} tanpaAksi
        onDetail={() => setDetail(p)} onJadikanAcuan={keRekomendasi} />
    ))
  }

  const totalHalaman = hasil ? Math.ceil(hasil.length / PER_HALAMAN) : 0
  const mulai = (halaman - 1) * PER_HALAMAN
  const hasilHalaman = hasil ? hasil.slice(mulai, mulai + PER_HALAMAN) : []
  const adaFilter = kategori || merek.length > 0 || hargaMin || hargaMax

  return (
    <div>
      <h2 className="page-title">Katalog produk</h2>
      <p className="page-sub">Cari berdasarkan nama atau merek, atau jelajahi per kategori.</p>

      {/* Search bar + tombol filter (menempel saat scroll) */}
      <div className="kat-atas">
        <div className="kat-bar">
          <div className="cari-box">
            <button className="cari-ikon" onClick={() => cari()} aria-label="Cari"><IkonCari /></button>
            <input className="cari-input" placeholder="Cari nama produk atau merek..."
              value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && cari()} />
          </div>
          <button className="btn-filter" onClick={() => setBukaFilter(v => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            Filter {adaFilter && <span className="filter-dot" />}
          </button>
        </div>

        {bukaFilter && (
          <div className="filter-pop">
            <div className="filter-pop-row">
              <div className="filter-field">
                <label className="small-label">Kategori</label>
                <Dropdown options={opsiKategori(kategoriList)} value={kategori} onChange={setKategori}
                  placeholder="Pilih kategori..." isSearchable isClearable />
              </div>
              <div className="filter-field">
                <label className="small-label">Merek</label>
                <Dropdown options={opsiTeks(merekList)} value={merek} onChange={setMerek}
                  placeholder="Pilih merek..." isMulti isSearchable />
              </div>
              <div className="filter-field">
                <label className="small-label">Harga minimum</label>
                <input type="number" min="0" placeholder="min" value={hargaMin}
                  onChange={e => setHargaMin(e.target.value)} />
              </div>
              <div className="filter-field">
                <label className="small-label">Harga maksimum</label>
                <input type="number" min="0" placeholder="maks" value={hargaMax}
                  onChange={e => setHargaMax(e.target.value)} />
              </div>
            </div>
            <div className="filter-pop-btns">
              <button className="btn-detail" onClick={reset}>Reset</button>
              <button className="btn-primary" onClick={() => cari()}>Terapkan</button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="kat-error">{error}</p>}
      {loading && <p>Memuat...</p>}

      {/* Mode cari/filter */}
      {!loading && hasil && (
        hasil.length > 0 ? (
          <>
            <div className="hasil-bar">
              <button className="btn-kembali" onClick={reset}>‹ Kembali ke katalog</button>
              {kategori && (
                <span className="filter-tag">
                  {kategori}
                  <button onClick={hapusKategori} aria-label="Hapus kategori">×</button>
                </span>
              )}
              {merek.map(m => (
                <span key={m} className="filter-tag">
                  {m}
                  <button onClick={() => hapusMerek(m)} aria-label={`Hapus merek ${m}`}>×</button>
                </span>
              ))}
            </div>
            {hasil.length >= BATAS_HASIL && (
              <p className="hasil-info">
                Menampilkan {BATAS_HASIL} produk pertama. Persempit pencarian dengan kata kunci atau filter harga.
              </p>
            )}
            <div className="produk-grid">{daftarKartu(hasilHalaman)}</div>
            {totalHalaman > 1 && (
              <div className="paging">
                <button disabled={halaman === 1} onClick={() => setHalaman(h => h - 1)}>‹ Sebelumnya</button>
                <span className="paging-info">Halaman {halaman} dari {totalHalaman}</span>
                <button disabled={halaman === totalHalaman} onClick={() => setHalaman(h => h + 1)}>Berikutnya ›</button>
              </div>
            )}
          </>
        ) : (
          <div className="hasil-bar">
            <p>Tidak ada produk ditemukan.</p>
            <button className="btn-kembali" onClick={reset}>‹ Kembali ke katalog</button>
          </div>
        )
      )}

      {/* Mode awal: per kategori */}
      {!loading && !hasil && !perKategori && !error && <p>Memuat katalog...</p>}
      {!loading && !hasil && perKategori && Object.keys(perKategori).map(kat => (
        <div key={kat} className="kat-section">
          <div className="kat-section-head">
            <div className="kat-section-title">{kat}</div>
            <button className="lihat-semua" onClick={() => lihatSemua(kat)}>
              Lihat semua
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="produk-grid">{daftarKartu(perKategori[kat])}</div>
        </div>
      ))}

      <DetailProduk produk={detail} onClose={() => setDetail(null)} onJadikanAcuan={keRekomendasi} />
    </div>
  )
}

export default Katalog
