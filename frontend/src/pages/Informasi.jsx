import { Link } from "react-router-dom"

const ALUR = [
  {
    judul: "Profil kandungan aktif",
    isi: "Data produk dibersihkan dan distandarkan, lalu setiap produk diubah menjadi profil kandungan aktif.",
  },
  {
    judul: "Segmentasi Fuzzy C-Means",
    isi: "Produk dikelompokkan ke beberapa segmen. Satu produk bisa menjadi anggota lebih dari satu segmen dengan derajat yang berbeda.",
  },
  {
    judul: "Cosine similarity",
    isi: "Profil keanggotaan dibandingkan dengan masukanmu. Produk dengan kemiripan tertinggi ditampilkan sebagai rekomendasi.",
  },
]

const LANGKAH = [
  { judul: "Pilih jenis masukan", isi: "Masalah kulit, produk acuan, atau kandungan aktif." },
  { judul: "Atur filter", isi: "Persempit hasil dengan kategori, merek, dan rentang harga." },
  { judul: "Lihat hasil", isi: "Buka Detail untuk melihat kandungan, profil segmen, dan rating produk." },
]

const HASIL = [
  {
    judul: "Persentase mirip",
    isi: "Skor cosine similarity antara produk dan masukanmu. Semakin tinggi, semakin mirip profil kandungannya.",
  },
  {
    judul: "Profil segmen",
    isi: "Derajat keanggotaan produk di tiap segmen hasil Fuzzy C-Means, ditampilkan dalam persen.",
  },
]

function Informasi() {
  return (
    <div className="informasi-page">
      <div className="page-title">Informasi</div>
      <div className="page-sub">
        Serasi merekomendasikan skincare berdasarkan kemiripan kandungan aktif,
        bukan rating atau riwayat pengguna.
      </div>

      {/* Cara kerja */}
      <section className="info-section">
        <div className="info-label">CARA KERJA</div>
        <div className="info-alur">
          {ALUR.map((a, i) => (
            <div key={a.judul} className="info-alur-item">
              <div className="info-no">{String(i + 1).padStart(2, "0")}</div>
              <h3>{a.judul}</h3>
              <p>{a.isi}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Panduan + membaca hasil */}
      <section className="info-section info-dua">
        <div className="info-box">
          <div className="info-label">CARA MENGGUNAKAN</div>
          <ol className="info-langkah">
            {LANGKAH.map(l => (
              <li key={l.judul}>
                <h3>{l.judul}</h3>
                <p>{l.isi}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="info-box">
          <div className="info-label">MEMBACA HASIL</div>
          {HASIL.map(h => (
            <div key={h.judul} className="info-hasil-item">
              <h3>{h.judul}</h3>
              <p>{h.isi}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Batasan */}
      <section className="info-section info-catatan">
        <strong>Perlu diketahui.</strong> Rekomendasi hanya berdasarkan data kandungan aktif
        di katalog. Skor kemiripan bukan ukuran kecocokan medis, dan hasilnya tidak
        menggantikan konsultasi dengan dokter kulit.
      </section>

      {/* Ajakan mencoba */}
      <section className="info-cta">
        <div>
          <h2>Temukan produk dengan kandungan yang serupa.</h2>
        </div>
        <Link to="/rekomendasi" className="info-cta-button">
          Cari rekomendasi →
        </Link>
      </section>
    </div>
  )
}

export default Informasi
