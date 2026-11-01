// Placeholder abu-abu berkilau selama data dimuat, bentuknya mengikuti KartuProduk
export function KartuSkeleton() {
  return (
    <div className="pcard2" aria-hidden="true">
      <div className="pcard2-head skel" />
      <div className="pcard2-body">
        <div className="skel skel-line" style={{ width: "40%" }} />
        <div className="skel skel-line skel-tebal" style={{ width: "90%" }} />
        <div className="skel skel-line skel-tebal" style={{ width: "65%" }} />
        <div className="kand-row">
          <div className="skel skel-chip" />
          <div className="skel skel-chip" />
        </div>
        <div className="pcard2-bawah">
          <div className="pcard2-foot">
            <div className="skel skel-line" style={{ width: "35%" }} />
            <div className="skel skel-line skel-tebal" style={{ width: "30%" }} />
          </div>
          <div className="pcard2-btns">
            <div className="skel skel-btn" />
            <div className="skel skel-btn" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function GridSkeleton({ jumlah = 8 }) {
  return (
    <div className="produk-grid" role="status" aria-label="Memuat produk">
      {Array.from({ length: jumlah }, (_, i) => <KartuSkeleton key={i} />)}
    </div>
  )
}
