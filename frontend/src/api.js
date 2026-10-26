// Semua komunikasi ke backend dikumpulkan di sini
const BACKEND = "http://127.0.0.1:8000"

export async function getStatistics() {
  const res = await fetch(`${BACKEND}/statistik`)
  return res.json()
}

export async function getOptions() {
  const res = await fetch(`${BACKEND}/opsi`)
  return res.json()
}

export async function getProductList() {
  const res = await fetch(`${BACKEND}/produk/daftar`)
  return res.json()
}

export async function recommendByProblem(problem, topN, categories, brands, minPrice, maxPrice) {
  const params = new URLSearchParams()
  params.append("masalah", problem)
  params.append("top_n", topN)
  params.append("harga_min", minPrice || 0)
  params.append("harga_max", maxPrice || 0)
  if (categories) categories.forEach(c => params.append("kategori", c))
  if (brands) brands.forEach(b => params.append("merek", b))
  const res = await fetch(`${BACKEND}/rekomendasi/masalah?${params}`)
  return res.json()
}

export async function recommendByProduct(productId, topN, categories, brands, minPrice, maxPrice) {
  const params = new URLSearchParams()
  params.append("product_id", productId)
  params.append("top_n", topN)
  params.append("harga_min", minPrice || 0)
  params.append("harga_max", maxPrice || 0)
  if (categories) categories.forEach(c => params.append("kategori", c))
  if (brands) brands.forEach(b => params.append("merek", b))
  const res = await fetch(`${BACKEND}/rekomendasi/produk?${params}`)
  return res.json()
}

export async function recommendByIngredients(ingredients, topN, categories, brands, minPrice, maxPrice) {
  const params = new URLSearchParams()
  params.append("top_n", topN)
  params.append("harga_min", minPrice || 0)
  params.append("harga_max", maxPrice || 0)
  if (categories) categories.forEach(c => params.append("kategori", c))
  if (brands) brands.forEach(b => params.append("merek", b))
  const res = await fetch(`${BACKEND}/rekomendasi/kandungan?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ingredients)
  })
  return res.json()
}

export async function getCategories() {
  const res = await fetch(`${BACKEND}/kategori`)
  return res.json()
}

export async function cariKatalog(keyword, kategori, hargaMin, hargaMax, merek) {
  const params = new URLSearchParams()
  if (keyword) params.append("keyword", keyword)
  if (kategori) params.append("kategori", kategori)
  if (hargaMin) params.append("harga_min", hargaMin)
  if (hargaMax) params.append("harga_max", hargaMax)
  if (merek) merek.forEach(m => params.append("merek", m))
  const res = await fetch(`${BACKEND}/katalog/cari?${params}`)
  return res.json()
}

export async function katalogPerKategori() {
  const res = await fetch(`${BACKEND}/katalog/per-kategori`)
  return res.json()
}