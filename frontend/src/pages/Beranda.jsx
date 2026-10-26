import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getCategories } from "../api"

function Beranda() {
    const [kategori, setKategori] = useState([])
    useEffect(() => {
    getCategories().then(data => setKategori(data))
  }, [])

  return (
    <div>
      {/* Hero */}
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

      {/* Jelajah kategori */}
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

      {/* Cara kerja */}
      <div className="cara-kerja">
      <div className="section-label">Cara kerja</div>
      <div className="cards">
        <div className="card">
          <div className="card-num">1</div>
          <div className="card-title">Beri masukan</div>
          <div className="card-body">Pilih masalah kulit, produk acuan, atau kandungan aktif.</div>
        </div>
        <div className="card">
          <div className="card-num">2</div>
          <div className="card-title">Sistem menghitung kemiripan</div>
          <div className="card-body">Produk disegmentasi dengan Fuzzy C-Means, lalu diukur dengan cosine similarity.</div>
        </div>
        <div className="card">
          <div className="card-num">3</div>
          <div className="card-title">Dapatkan Top-N produk</div>
          <div className="card-body">Daftar produk paling sesuai muncul dengan skor kemiripannya.</div>
        </div>
      </div>
        </div>

        
      {/* Keunggulan Serasi */}
      <section className="home-extra">
        <div className="section-label">Mengapa Serasi?</div>
        <h2 className="home-extra-title">Rekomendasi berdasarkan karakteristik bahan aktif</h2>
        <p className="home-extra-desc">
          Serasi menggabungkan pengelompokan produk dan pengukuran kemiripan
          untuk membantu menemukan skincare dengan profil kandungan yang serupa.
        </p>

        <div className="home-benefit-grid">
          <div className="home-benefit-card">
            <div className="home-benefit-number">01</div>
            <h3>Fuzzy C-Means</h3>
            <p>
              Mengelompokkan produk berdasarkan karakteristik kandungan aktif
              dengan pendekatan fuzzy clustering.
            </p>
          </div>

          <div className="home-benefit-card">
            <div className="home-benefit-number">02</div>
            <h3>Profil bahan aktif</h3>
            <p>
              Memanfaatkan informasi kandungan aktif sebagai dasar
              perbandingan karakteristik produk skincare.
            </p>
          </div>

          <div className="home-benefit-card">
            <div className="home-benefit-number">03</div>
            <h3>Cosine Similarity</h3>
            <p>
              Mengukur kemiripan representasi produk untuk membantu
              menentukan rekomendasi yang relevan.
            </p>
          </div>
        </div>
      </section>

      {/* Ajakan mencoba */}
      <section className="home-cta">
        <div>
          <div className="home-cta-label">Mulai eksplorasi</div>
          <h2>Temukan skincare yang sesuai dengan kebutuhanmu.</h2>
          <p>
            Jelajahi rekomendasi produk berdasarkan kemiripan profil
            kandungan aktif.
          </p>
        </div>

        <Link to="/rekomendasi" className="home-cta-button">
          Cari rekomendasi →
        </Link>
      </section>



    </div>
  )
}

export default Beranda