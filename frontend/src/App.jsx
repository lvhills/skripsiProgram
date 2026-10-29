import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import Beranda from "./pages/Beranda"
import Rekomendasi from "./pages/Rekomendasi"
import Katalog from "./pages/Katalog"
import Informasi from "./pages/Informasi"

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/rekomendasi" element={<Rekomendasi />} />
          <Route path="/katalog" element={<Katalog />} />
          <Route path="/informasi" element={<Informasi />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  )
}

export default App
