const WARNA_SEGMEN = ["#6FA8C7", "#7FAF6E", "#A987C0", "#D9A648", "#5FB39A"]

function DetailProduk({ produk, onClose, onJadikanAcuan }) {
  if (!produk) return null
  const kand = produk.kandungan || []
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-grid">
          {/* Kiri: foto */}
          <div className="modal-foto">
            {produk.image_url
              ? <img src={produk.image_url} alt={produk.product} />
              : <div className="modal-noimg">{produk.brand?.slice(0, 2).toUpperCase()}</div>}
          </div>
          {/* Kanan: detail */}
          <div className="modal-detail">
            <div className="modal-brand">{produk.brand}</div>
            <h2 className="modal-name">{produk.product}</h2>
            {produk.rating > 0 && (
              <div className="modal-rating">★ {produk.rating} · {produk.total_review} ulasan</div>
            )}
            <div className="modal-harga">Rp{Number(produk.price || 0).toLocaleString("id-ID")}</div>

            <div className="modal-sect">Kategori</div>
            <div>{produk.category}</div>

            <div className="modal-sect">Profil segmen</div>
            {produk.keanggotaan && produk.keanggotaan.length > 0 ? (
              <>
                <div className="mini-seg-bar">
                  {produk.keanggotaan.map((s, i) => (
                    s.persen > 0 && (
                      <div key={i} style={{ width: `${s.persen}%`, background: WARNA_SEGMEN[i % 5] }}
                        title={`${s.segmen} ${s.persen}%`} />
                    )
                  ))}
                </div>
                <div className="mini-seg-top" style={{ marginTop: 8 }}>
                  {[...produk.keanggotaan].sort((a, b) => b.persen - a.persen).map((s, i) => (
                    <span key={i}>{s.segmen} {s.persen}%</span>
                  ))}
                </div>
              </>
            ) : <div className="seg-tag">{produk.segmen}</div>}

            {kand.length > 0 && (
              <>
                <div className="modal-sect">Kandungan aktif</div>
                <div className="kand-row">
                  {kand.map(k => <span key={k} className="kand-chip">{k}</span>)}
                </div>
              </>
            )}

            {produk.description && (
              <>
                <div className="modal-sect">Deskripsi</div>
                <p className="modal-desc">{produk.description}</p>
              </>
            )}

            {produk.total_review > 0 && (
              <>
                <div className="modal-sect">Rating ({produk.total_review} ulasan)</div>
                <div className="rating-detail">
                  {[5, 4, 3, 2, 1].map(b => {
                    const jml = produk[`star_${b}`] || 0
                    const persen = produk.total_review > 0 ? (jml / produk.total_review * 100) : 0
                    return (
                      <div key={b} className="rating-baris">
                        <span className="rating-label">{b} ★</span>
                        <span className="rating-track">
                          <span className="rating-fill" style={{ width: `${persen}%` }} />
                        </span>
                        <span className="rating-jml">{jml}</span>
                      </div>
                    )
                  })}
                </div>
                {produk.recommended_percentage > 0 && (
                  <div className="rekomen-persen">
                    {produk.recommended_percentage}% merekomendasikan produk ini
                  </div>
                )}
              </>
            )}

            <button className="btn-acuan modal-btn sticky-btn" onClick={() => { onJadikanAcuan(produk); onClose() }}>
              Cari rekomendasi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetailProduk