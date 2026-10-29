import { Link } from "react-router-dom"

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" className="brand">serasi<span>.</span></Link>
          <p>
            Rekomendasi skincare berdasarkan profil bahan aktif
            untuk membantu menemukan produk yang sesuai dengan
            kebutuhan kulitmu.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-heading">Jelajahi</div>
          <Link to="/">Beranda</Link>
          <Link to="/rekomendasi">Rekomendasi</Link>
          <Link to="/katalog">Katalog</Link>
          <Link to="/informasi">Informasi</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Serasi.</span>
        <span>Temukan skincare yang sesuai denganmu.</span>
      </div>
    </footer>
  )
}

export default Footer
