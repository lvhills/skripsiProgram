const WARNA_SEGMEN = ["#6FA8C7", "#7FAF6E", "#A987C0", "#D9A648", "#5FB39A"]

function KartuProduk({ produk, onJadikanAcuan, onDetail, tanpaAksi }) {
  const persen = produk.similarity !== undefined ? (produk.similarity * 100).toFixed(2) : null
  const idx = (produk.segmen_idx ?? 0) % WARNA_SEGMEN.length
  const warna = WARNA_SEGMEN[idx]
  const kand = produk.kandungan || []

  return (
    <div className="pcard2">
      {/* Header foto */}
      <div className="pcard2-head">
        {produk.image_url
          ? <img src={produk.image_url} alt={produk.product} className="pcard2-foto" />
          : <div className="pcard2-inisial-wrap"><span className="pcard2-inisial2">{produk.brand?.slice(0, 2).toUpperCase()}</span></div>}
        {!tanpaAksi && persen !== null && (
          <span className="badge-mirip2"><b>{persen}%</b> similarity</span>
        )}
        <div className="pcard2-segline" style={{ background: warna }} />
      </div>

      {/* Isi */}
      <div className="pcard2-body">
        <div className="pcard2-brand">{produk.brand}</div>
        <div className="pcard2-name">{produk.product}</div>
        <div className="pcard2-rating">
          {produk.rating > 0 && <>★ {produk.rating} · {produk.total_review} ulasan</>}
        </div>

        {kand.length > 0 && (
          <div className="kand-row">
            {kand.slice(0, 3).map(k => <span key={k} className="kand-chip">{k}</span>)}
            {kand.length > 3 && <span className="kand-chip">+{kand.length - 3}</span>}
          </div>
        )}

        {/* Bagian bawah selalu menempel ke dasar kartu agar sejajar antar kartu */}
        <div className="pcard2-bawah">
          {/* Bar skor hanya di mode rekomendasi */}
          {!tanpaAksi && persen !== null && (
            <div className="skor-bar"><div className="skor-isi" style={{ width: `${persen}%` }} /></div>
          )}

          {/* Segmen + harga */}
          <div className="pcard2-foot">
            <span className="seg-tag">
              <span className="seg-dot" style={{ background: warna }} />
              {produk.segmen || produk.category}
            </span>
            {produk.price > 0 && (
              <span className="pcard2-harga">Rp{Number(produk.price).toLocaleString("id-ID")}</span>
            )}
          </div>

          {/* Tombol */}
          <div className="pcard2-btns">
            <button className="btn-detail" onClick={() => onDetail && onDetail()}>Detail</button>
            <button className="btn-acuan" onClick={() => onJadikanAcuan && onJadikanAcuan(produk)}>
              {tanpaAksi ? "Cari rekomendasi" : "Jadikan acuan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KartuProduk