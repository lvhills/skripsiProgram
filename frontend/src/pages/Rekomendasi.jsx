import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import {
  getOptions, getProductList, getCategories,
  recommendByProblem, recommendByProduct, recommendByIngredients
} from "../api"
import KartuProduk from "../components/KartuProduk"
import DetailProduk from "../components/DetailProduk"
import Dropdown from "../components/Dropdown"

const MODE = [
  { nama: "Masalah kulit", ikon: "✿", desc: "Mulai dari keluhan kulitmu", judul: "Apa masalah kulitmu?" },
  { nama: "Produk acuan", ikon: "◎", desc: "Cari yang mirip produk favoritmu", judul: "Produk apa yang jadi acuan?" },
  { nama: "Kandungan aktif", ikon: "⚗", desc: "Pilih bahan yang kamu inginkan", judul: "Kandungan apa yang kamu cari?" },
]

function Rekomendasi() {
  const [searchParams] = useSearchParams()
  const [opsi, setOpsi] = useState(null)
  const [kategoriList, setKategoriList] = useState([])
  const [daftarProduk, setDaftarProduk] = useState([])

  const [mode, setMode] = useState("Masalah kulit")
  const [masalah, setMasalah] = useState("")
  const [produkAcuan, setProdukAcuan] = useState("")
  const [kandungan, setKandungan] = useState([])
  const [topN, setTopN] = useState(5)

  // filter
  const [kategori, setKategori] = useState("")
  const [merek, setMerek] = useState([])
  const [hargaMin, setHargaMin] = useState("")
  const [hargaMax, setHargaMax] = useState("")

  // urutan & pencarian & detail
  const [urutan, setUrutan] = useState("mirip")
  const [cariProduk, setCariProduk] = useState("")
  const [detailProduk, setDetailProduk] = useState(null)

  const [hasil, setHasil] = useState(null)

  useEffect(() => {
    getOptions().then(data => {
      setOpsi(data)
      if (data.masalah && data.masalah.length) setMasalah(data.masalah[0])
    })
    getCategories().then(data => setKategoriList(data))
  }, [])

  // Muat daftar produk, lalu pakai produk acuan dari katalog (?acuan=<product_id>) bila ada
  useEffect(() => {
    getProductList().then(data => {
      setDaftarProduk(data)
      const acuan = searchParams.get("acuan")
      const prod = acuan && data.find(p => String(p.product_id) === acuan)
      if (!prod) return
      setMode("Produk acuan")
      setProdukAcuan(String(prod.product_id))
      setCariProduk(prod.product + " — " + prod.brand)
    })
  }, [searchParams])

  async function cari() {
    const cats = kategori ? [kategori] : []
    const min = Number(hargaMin) || 0
    const max = Number(hargaMax) || 0
    let data
    if (mode === "Masalah kulit") {
      data = await recommendByProblem(masalah, topN, cats, merek, min, max)
    } else if (mode === "Produk acuan") {
      if (!produkAcuan) { alert("Pilih produk acuan dulu"); return }
      data = await recommendByProduct(Number(produkAcuan), topN, cats, merek, min, max)
    } else {
      if (kandungan.length === 0) { alert("Pilih minimal satu kandungan"); return }
      data = await recommendByIngredients(kandungan, topN, cats, merek, min, max)
    }
    setHasil(data)
  }

  function hasilTerurut() {
    if (!hasil || !hasil.hasil) return []
    const arr = [...hasil.hasil]
    if (urutan === "harga-asc") arr.sort((a, b) => (a.price || 0) - (b.price || 0))
    else if (urutan === "harga-desc") arr.sort((a, b) => (b.price || 0) - (a.price || 0))
    return arr
  }

  function pilihAcuan(prod) {
    setMode("Produk acuan")
    setProdukAcuan(String(prod.product_id))
    setCariProduk(prod.product + " — " + prod.brand)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!opsi) return <p>Memuat...</p>

  const produkTerpilih = produkAcuan ? daftarProduk.find(p => String(p.product_id) === produkAcuan) : null
  const saranProduk = daftarProduk
    .filter(p => (p.product + " " + p.brand).toLowerCase().includes(cariProduk.toLowerCase()))
    .slice(0, 8)
  const siap = (mode === "Masalah kulit" && masalah)
    || (mode === "Produk acuan" && produkAcuan)
    || (mode === "Kandungan aktif" && kandungan.length > 0)

  return (
    <div>
      <h2 className="page-title">Cari rekomendasi</h2>
      <p className="page-sub">Pilih jenis masukan, lalu perhalus dengan filter di sebelah kiri.</p>

      <div className="rec-wrap">
        {/* KIRI: Filter */}
        <aside className="filter-side">
          <div className="filter-title">Filter</div>

          <div className="filter-field">
            <label className="small-label">Kategori</label>
            <Dropdown
              options={kategoriList.map(k => ({ value: k.category, label: `${k.category} (${k.jumlah})` }))}
              value={kategori} onChange={setKategori}
              placeholder="Pilih kategori..." isSearchable isClearable />
          </div>

          <div className="filter-field">
            <label className="small-label">Merek</label>
            <Dropdown
              options={(opsi.merek || []).map(m => ({ value: m, label: m }))}
              value={merek} onChange={setMerek}
              placeholder="Pilih merek..." isMulti isSearchable />
          </div>

          <div className="filter-field">
            <label className="small-label">Rentang harga (Rp)</label>
            <div className="price-range">
              <input type="number" placeholder="min" value={hargaMin}
                onChange={e => setHargaMin(e.target.value)} />
              <span>–</span>
              <input type="number" placeholder="maks" value={hargaMax}
                onChange={e => setHargaMax(e.target.value)} />
            </div>
          </div>

          <div className="filter-field">
            <label className="small-label">Jumlah rekomendasi</label>
            <Dropdown
              options={[5, 10, 15, 20].map(n => ({ value: n, label: String(n) }))}
              value={topN} onChange={setTopN} />
          </div>
        </aside>

        {/* KANAN: Input */}
        <main className="input-side">
          <div className="panel">
            <div className="langkah-judul"><span className="langkah-no">1</span>Cari berdasarkan</div>
            <div className="mode-row">
              {MODE.map(m => (
                <button key={m.nama} className={mode === m.nama ? "mode-btn active" : "mode-btn"}
                  onClick={() => setMode(m.nama)}>
                  <span className="mode-ikon">{m.ikon}</span>
                  <span className="mode-nama">{m.nama}</span>
                  <span className="mode-desc">{m.desc}</span>
                </button>
              ))}
            </div>

            <div className="langkah-judul"><span className="langkah-no">2</span>{MODE.find(m => m.nama === mode).judul}</div>
            <div className="input-area">
              {mode === "Masalah kulit" && (
                <div className="chip-row">
                  {opsi.masalah.map(m => (
                    <button key={m} className={masalah === m ? "chip active" : "chip"}
                      onClick={() => setMasalah(m)}>
                      {masalah === m && <span className="chip-cek">✓</span>}{m}
                    </button>
                  ))}
                </div>
              )}

              {mode === "Produk acuan" && (
                produkTerpilih ? (
                  <div className="acuan-terpilih">
                    <div>
                      <div className="acuan-merek">{produkTerpilih.brand}</div>
                      <div className="acuan-nama">{produkTerpilih.product}</div>
                    </div>
                    <button className="acuan-ganti" onClick={() => { setProdukAcuan(""); setCariProduk("") }}>
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div className="acuan-cari">
                    <div className="cari-box">
                      <span className="cari-ikon-kiri">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="7" />
                          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input type="text" className="cari-input"
                        placeholder="Ketik nama produk atau merek..."
                        value={cariProduk}
                        onChange={e => { setCariProduk(e.target.value); setProdukAcuan("") }} />
                    </div>
                    {cariProduk.length >= 2 && (
                      <div className="cari-hasil">
                        {saranProduk.length > 0 ? saranProduk.map(p => (
                          <div key={p.product_id} className="cari-item"
                            onClick={() => { setProdukAcuan(String(p.product_id)); setCariProduk(p.product + " — " + p.brand) }}>
                            {p.product} <span className="cari-merek">{p.brand}</span>
                          </div>
                        )) : <div className="cari-kosong">Produk tidak ditemukan</div>}
                      </div>
                    )}
                    {cariProduk.length < 2 && <p className="input-hint">Ketik minimal 2 huruf untuk mencari.</p>}
                  </div>
                )
              )}

              {mode === "Kandungan aktif" && (
                <>
                  <Dropdown isMulti isSearchable
                    options={opsi.kandungan.map(k => ({ value: k, label: k }))}
                    value={kandungan} onChange={setKandungan}
                    placeholder="Ketik atau pilih kandungan..." />
                  <p className="input-hint">Pilih satu atau lebih kandungan yang kamu cari.</p>
                </>
              )}
            </div>

            <div className="panel-aksi">
              <button className="btn-primary btn-cari" onClick={cari} disabled={!siap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                </svg>
                Cari produk mirip
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Hasil */}
      {hasil && (
        <div className="hasil">
          {hasil.hasil && hasil.hasil.length > 0 ? (
            <>
              <div className="hasil-head">
                <div className="section-label">{hasil.hasil.length} produk paling mirip</div>
                <div className="urut-select">
                  <Dropdown kecil value={urutan} onChange={setUrutan} options={[
                    { value: "mirip", label: "Urutkan: Paling mirip" },
                    { value: "harga-asc", label: "Harga terendah" },
                    { value: "harga-desc", label: "Harga tertinggi" },
                  ]} />
                </div>
              </div>
              <div className="produk-grid">
                {hasilTerurut().map(p => (
                  <KartuProduk key={p.product_id} produk={p}
                    onDetail={() => setDetailProduk(p)}
                    onJadikanAcuan={pilihAcuan} />
                ))}
              </div>
            </>
          ) : (
            <p>Tidak ada produk yang cocok. Coba longgarkan filter.</p>
          )}
        </div>
      )}

      <DetailProduk
        produk={detailProduk}
        onClose={() => setDetailProduk(null)}
        onJadikanAcuan={pilihAcuan}
      />
    </div>
  )
}

export default Rekomendasi