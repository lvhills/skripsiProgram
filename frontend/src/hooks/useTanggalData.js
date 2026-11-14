import { useEffect, useState } from "react"
import { getMetadata } from "../api"
import { formatTanggalWIB } from "../utils"

// Tanggal pembaruan data produk terakhir ("14 November 2026"), atau null bila kosong/gagal diambil
export function useTanggalData() {
  const [tanggal, setTanggal] = useState(null)
  useEffect(() => {
    getMetadata()
      .then(d => setTanggal(formatTanggalWIB(d?.data_diperbarui_terakhir)))
      .catch(() => setTanggal(null))
  }, [])
  return tanggal
}
