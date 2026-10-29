// Semua komunikasi ke backend dikumpulkan di sini
const BACKEND = "http://127.0.0.1:8000"

async function ambil(path, options) {
  const res = await fetch(`${BACKEND}${path}`, options)
  return res.json()
}

// Parameter filter yang dipakai ketiga jalur rekomendasi
function paramsFilter(topN, categories, brands, minPrice, maxPrice) {
  const params = new URLSearchParams()
  params.append("top_n", topN)
  params.append("harga_min", minPrice || 0)
  params.append("harga_max", maxPrice || 0)
  categories?.forEach(c => params.append("kategori", c))
  brands?.forEach(b => params.append("merek", b))
  return params
}

export function getOptions() {
  return ambil("/opsi")
}

export function getProductList() {
  return ambil("/produk/daftar")
}

export function getCategories() {
  return ambil("/kategori")
}

export function recommendByProblem(problem, topN, categories, brands, minPrice, maxPrice) {
  const params = paramsFilter(topN, categories, brands, minPrice, maxPrice)
  params.append("masalah", problem)
  return ambil(`/rekomendasi/masalah?${params}`)
}

export function recommendByProduct(productId, topN, categories, brands, minPrice, maxPrice) {
  const params = paramsFilter(topN, categories, brands, minPrice, maxPrice)
  params.append("product_id", productId)
  return ambil(`/rekomendasi/produk?${params}`)
}

export function recommendByIngredients(ingredients, topN, categories, brands, minPrice, maxPrice) {
  const params = paramsFilter(topN, categories, brands, minPrice, maxPrice)
  return ambil(`/rekomendasi/kandungan?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ingredients),
  })
}

export function cariKatalog(keyword, kategori, hargaMin, hargaMax, merek) {
  const params = new URLSearchParams()
  if (keyword) params.append("keyword", keyword)
  if (kategori) params.append("kategori", kategori)
  if (hargaMin) params.append("harga_min", hargaMin)
  if (hargaMax) params.append("harga_max", hargaMax)
  merek?.forEach(m => params.append("merek", m))
  return ambil(`/katalog/cari?${params}`)
}

export function katalogPerKategori() {
  return ambil("/katalog/per-kategori")
}
