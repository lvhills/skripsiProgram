import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getCategories } from "../api"

const CARA_KERJA = [
  { judul: "Beri masukan", isi: "Pilih masalah kulit, produk acuan, atau kandungan aktif." },
  { judul: "Sistem menghitung kemiripan", isi: "Produk disegmentasi dengan Fuzzy C-Means, lalu diukur dengan cosine similarity." },
  { judul: "Dapatkan Top-N produk", isi: "Daftar produk paling sesuai muncul dengan skor kemiripannya." },
]

const KEUNGGULAN = [
  { judul: "Fuzzy C-Means", isi: "Mengelompokkan produk berdasarkan karakteristik kandungan aktif dengan pendekatan fuzzy clustering." },
  { judul: "Profil bahan aktif", isi: "Memanfaatkan informasi kandungan aktif sebagai dasar perbandingan karakteristik produk skincare." },
  { judul: "Cosine Similarity", isi: "Mengukur kemiripan representasi produk untuk membantu menentukan rekomendasi yang relevan." },
]

function Beranda() {
  const [kategori, setKategori] = useState([])

  useEffect(() => {
    getCategories().then(setKategori)
  }, [])

  return (
    <div>
      <div className="hero">
        <div className="eyebrow">Sistem Rekomendasi Produk Skincare</div>
        <h1>Temukan produk dengan<br />profil bahan aktif yang serupa</h1>
        <p>
          Alih-alih mengandalkan rating atau popularitas, serasi mengelompokkan
          produk berdasarkan kandungan aktifnya lalu mencari yang paling mirip
          dengan kebutuhanmu.
        </p>
        <div className="hero-btns">
          <Link to="/rekomendasi" className="hero-btn-solid">Cari rekomendasi</Link>
          <Link to="/katalog" className="hero-btn-outline">Jelajahi katalog</Link>
        </div>
      </div>

      <div className="section-title">Jelajahi berdasarkan kategori</div>
      <div className="kat-row">
        {kategori.slice(0, 10).map(k => (
          <Link key={k.category} to={`/katalog?kategori=${encodeURIComponent(k.category)}`} className="kat-item">
            <div className="kat-img">
              {k.image_url
                ? <img src={k.image_url} alt={k.category} />
                : <div className="kat-noimg">{k.category.slice(0, 2)}</div>}
            </div>
            <div className="kat-name">{k.category}</div>
          </Link>
        ))}
      </div>

      <div className="cara-kerja">
        <div className="section-label">Cara kerja</div>
        <div className="cards">
          {CARA_KERJA.map((c, i) => (
            <div key={c.judul} className="card">
              <div className="card-num">{i + 1}</div>
              <div className="card-title">{c.judul}</div>
              <div className="card-body">{c.isi}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="home-extra">
        <div className="section-label">Mengapa Serasi?</div>
        <h2 className="home-extra-title">Rekomendasi berdasarkan karakteristik bahan aktif</h2>
        <p className="home-extra-desc">
          Serasi menggabungkan pengelompokan produk dan pengukuran kemiripan
          untuk membantu menemukan skincare dengan profil kandungan yang serupa.
        </p>
        <div className="home-benefit-grid">
          {KEUNGGULAN.map((k, i) => (
            <div key={k.judul} className="home-benefit-card">
              <div className="home-benefit-number">{String(i + 1).padStart(2, "0")}</div>
              <h3>{k.judul}</h3>
              <p>{k.isi}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div>
          <div className="home-cta-label">Mulai eksplorasi</div>
          <h2>Temukan skincare yang sesuai dengan kebutuhanmu.</h2>
          <p>Jelajahi rekomendasi produk berdasarkan kemiripan profil kandungan aktif.</p>
        </div>
        <Link to="/rekomendasi" className="home-cta-button">Cari rekomendasi →</Link>
      </section>
    </div>
  )
}

export default Beranda
