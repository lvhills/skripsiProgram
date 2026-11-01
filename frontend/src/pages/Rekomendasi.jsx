import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import {
  getOptions, getProductList, getCategories,
  recommendByProblem, recommendByProduct, recommendByIngredients
} from "../api"
import KartuProduk from "../components/KartuProduk"
import DetailProduk from "../components/DetailProduk"
import { GridSkeleton } from "../components/Skeleton"
import Dropdown from "../components/Dropdown"
import IkonCari from "../components/IkonCari"
import { opsiKategori, opsiTeks } from "../utils"

const MODE = [
  { nama: "Masalah kulit", ikon: "✿", desc: "Mulai dari keluhan kulitmu", judul: "Apa masalah kulitmu?" },
  { nama: "Produk acuan", ikon: "◎", desc: "Cari yang mirip produk favoritmu", judul: "Produk apa yang jadi acuan?" },
  { nama: "Kandungan aktif", ikon: "⚗", desc: "Pilih bahan yang kamu inginkan", judul: "Kandungan apa yang kamu cari?" },
]

const OPSI_TOP_N = [5, 10, 15, 20].map(n => ({ value: n, label: String(n) }))

const OPSI_URUTAN = [
  { value: "mirip", label: "Urutkan: Paling mirip" },
  { value: "harga-asc", label: "Harga terendah" },
  { value: "harga-desc", label: "Harga tertinggi" },
]

function urutkan(produkList, urutan) {
  const arr = [...produkList]
  if (urutan === "harga-asc") arr.sort((a, b) => (a.price || 0) - (b.price || 0))
  else if (urutan === "harga-desc") arr.sort((a, b) => (b.price || 0) - (a.price || 0))
  return arr
}

function Rekomendasi() {
  const [searchParams] = useSearchParams()
  const [opsi, setOpsi] = useState(null)
  const [kategoriList, setKategoriList] = useState([])
  const [daftarProduk, setDaftarProduk] = useState([])

  // masukan
  const [mode, setMode] = useState("Masalah kulit")
  const [masalah, setMasalah] = useState("")
  const [produkAcuan, setProdukAcuan] = useState("")
  const [cariProduk, setCariProduk] = useState("")
  const [kandungan, setKandungan] = useState([])

  // filter
  const [kategori, setKategori] = useState("")
  const [merek, setMerek] = useState([])
  const [hargaMin, setHargaMin] = useState("")
  const [hargaMax, setHargaMax] = useState("")
  const [topN, setTopN] = useState(5)

  // hasil
  const [hasil, setHasil] = useState(null)
  const [memuat, setMemuat] = useState(false)
  const [urutan, setUrutan] = useState("mirip")
  const [detailProduk, setDetailProduk] = useState(null)

  useEffect(() => {
    getOptions().then(data => {
      setOpsi(data)
      if (data.masalah?.length) setMasalah(data.masalah[0])
    })
    getCategories().then(setKategoriList)
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
    })
  }, [searchParams])

  function pilihProduk(prod) {
    setMode("Produk acuan")
    setProdukAcuan(String(prod.product_id))
  }

  function gantiProduk() {
    setProdukAcuan("")
    setCariProduk("")
  }

  // Dari tombol "Jadikan acuan" di kartu hasil
  function jadikanAcuan(prod) {
    pilihProduk(prod)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function cari() {
    const cats = kategori ? [kategori] : []
    const min = Number(hargaMin) || 0
    const max = Number(hargaMax) || 0
    let data
    setMemuat(true)
    try {
      if (mode === "Masalah kulit") {
        data = await recommendByProblem(masalah, topN, cats, merek, min, max)
      } else if (mode === "Produk acuan") {
        data = await recommendByProduct(Number(produkAcuan), topN, cats, merek, min, max)
      } else {
        data = await recommendByIngredients(kandungan, topN, cats, merek, min, max)
      }
      setHasil(data)
    } finally {
      setMemuat(false)
    }
  }

  if (!opsi) return (
    <div>
      <h2 className="page-title">Cari rekomendasi</h2>
      <p className="page-sub">Pilih jenis masukan, lalu perhalus dengan filter di sebelah kiri.</p>
      <div className="rec-wrap" role="status" aria-label="Memuat">
        <div className="filter-side">
          <div className="skel skel-line skel-tebal" style={{ width: "35%", marginBottom: 20 }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="filter-field">
              <div className="skel skel-line" style={{ width: "50%", marginBottom: 8 }} />
              <div className="skel skel-input" />
            </div>
          ))}
        </div>
        <div className="input-side">
          <div className="panel">
            <div className="skel skel-line skel-tebal" style={{ width: "30%", marginBottom: 16 }} />
            <div className="mode-row">
              {[1, 2, 3].map(i => <div key={i} className="skel skel-mode" />)}
            </div>
            <div className="skel skel-line skel-tebal" style={{ width: "40%", marginBottom: 16 }} />
            <div className="chip-row">
              {[90, 120, 80, 110].map(w => <div key={w} className="skel skel-chip-besar" style={{ width: w }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const produkTerpilih = produkAcuan ? daftarProduk.find(p => String(p.product_id) === produkAcuan) : null
  const saranProduk = daftarProduk
    .filter(p => (p.product + " " + p.brand).toLowerCase().includes(cariProduk.toLowerCase()))
    .slice(0, 8)
  const siap = (mode === "Masalah kulit" && masalah)
    || (mode === "Produk acuan" && produkAcuan)
    || (mode === "Kandungan aktif" && kandungan.length > 0)
  const daftarHasil = hasil?.hasil || []

  return (
    <div>
      <h2 className="page-title">Cari rekomendasi</h2>
      <p className="page-sub">Pilih jenis masukan, lalu perhalus dengan filter di sebelah kiri.</p>

      <div className="rec-wrap">
        {/* Kiri: filter */}
        <aside className="filter-side">
          <div className="filter-title">Filter</div>

          <div className="filter-field">
            <label className="small-label">Kategori</label>
            <Dropdown options={opsiKategori(kategoriList)} value={kategori} onChange={setKategori}
              placeholder="Pilih kategori..." isSearchable isClearable />
          </div>

          <div className="filter-field">
            <label className="small-label">Merek</label>
            <Dropdown options={opsiTeks(opsi.merek || [])} value={merek} onChange={setMerek}
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
            <Dropdown options={OPSI_TOP_N} value={topN} onChange={setTopN} />
          </div>
        </aside>

        {/* Kanan: masukan */}
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

            <div className="langkah-judul">
              <span className="langkah-no">2</span>{MODE.find(m => m.nama === mode).judul}
            </div>
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
                    <button className="acuan-ganti" onClick={gantiProduk}>Ganti</button>
                  </div>
                ) : (
                  <div className="acuan-cari">
                    <div className="cari-box">
                      <span className="cari-ikon-kiri"><IkonCari /></span>
                      <input type="text" className="cari-input"
                        placeholder="Ketik nama produk atau merek..."
                        value={cariProduk}
                        onChange={e => setCariProduk(e.target.value)} />
                    </div>
                    {cariProduk.length >= 2 ? (
                      <div className="cari-hasil">
                        {saranProduk.length > 0 ? saranProduk.map(p => (
                          <div key={p.product_id} className="cari-item" onClick={() => pilihProduk(p)}>
                            {p.product} <span className="cari-merek">{p.brand}</span>
                          </div>
                        )) : <div className="cari-kosong">Produk tidak ditemukan</div>}
                      </div>
                    ) : <p className="input-hint">Ketik minimal 2 huruf untuk mencari.</p>}
                  </div>
                )
              )}

              {mode === "Kandungan aktif" && (
                <>
                  <Dropdown isMulti isSearchable options={opsiTeks(opsi.kandungan)}
                    value={kandungan} onChange={setKandungan}
                    placeholder="Ketik atau pilih kandungan..." />
                  <p className="input-hint">Pilih satu atau lebih kandungan yang kamu cari.</p>
                </>
              )}
            </div>

            <div className="panel-aksi">
              <button className="btn-primary btn-cari" onClick={cari} disabled={!siap || memuat}>
                <IkonCari ukuran={16} tebal={2.2} />
                Cari produk mirip
              </button>
            </div>
          </div>
        </main>
      </div>

      {memuat && (
        <div className="hasil">
          <div className="hasil-head">
            <div className="skel skel-line skel-tebal" style={{ width: 180 }} />
          </div>
          <GridSkeleton jumlah={topN} />
        </div>
      )}

      {!memuat && hasil && (
        <div className="hasil">
          {daftarHasil.length > 0 ? (
            <>
              <div className="hasil-head">
                <div className="section-label">{daftarHasil.length} produk paling mirip</div>
                <div className="urut-select">
                  <Dropdown kecil options={OPSI_URUTAN} value={urutan} onChange={setUrutan} />
                </div>
              </div>
              <div className="produk-grid">
                {urutkan(daftarHasil, urutan).map(p => (
                  <KartuProduk key={p.product_id} produk={p}
                    onDetail={() => setDetailProduk(p)}
                    onJadikanAcuan={jadikanAcuan} />
                ))}
              </div>
            </>
          ) : (
            <p>Tidak ada produk yang cocok. Coba longgarkan filter.</p>
          )}
        </div>
      )}

      <DetailProduk produk={detailProduk} onClose={() => setDetailProduk(null)} onJadikanAcuan={jadikanAcuan} />
    </div>
  )
}

export default Rekomendasi
