import { NavLink } from "react-router-dom"

function Navbar() {
  return (
    <header className="header">
      <div className="brand-area">
        <div className="brand">serasi<span>.</span></div>
        <div className="brand-sub">rekomendasi skincare berdasarkan profil bahan aktif</div>
      </div>
      <nav className="nav-links">
        <NavLink to="/">Beranda</NavLink>
        <NavLink to="/rekomendasi">Rekomendasi</NavLink>
        <NavLink to="/katalog">Katalog</NavLink>
        <NavLink to="/informasi">Informasi</NavLink>
      </nav>
    </header>
  )
}

export default Navbar