import Select from "react-select"

// Dropdown seragam (react-select) untuk semua pilihan di aplikasi.
// options: [{ value, label }], value: nilai biasa (atau array bila isMulti), onChange menerima nilai biasa.
function Dropdown({ options, value, onChange, placeholder, isMulti, isSearchable = false, isClearable, kecil }) {
  const terpilih = isMulti
    ? options.filter(o => value.includes(o.value))
    : options.find(o => o.value === value) ?? null

  function ubah(o) {
    if (isMulti) onChange(o.map(x => x.value))
    else onChange(o ? o.value : "")
  }

  return (
    <Select
      options={options}
      value={terpilih}
      onChange={ubah}
      placeholder={placeholder}
      isMulti={isMulti}
      isSearchable={isSearchable}
      isClearable={isClearable}
      closeMenuOnSelect={!isMulti}
      noOptionsMessage={() => "Tidak ditemukan"}
      menuPortalTarget={document.body}
      styles={{
        control: (base, state) => ({
          ...base,
          borderColor: state.isFocused ? "#E59AAA" : "#F3E1E6",
          borderRadius: kecil ? 10 : 12,
          padding: kecil ? 0 : 2,
          minHeight: kecil ? 36 : 46,
          fontSize: kecil ? 13 : 14,
          boxShadow: state.isFocused ? "0 0 0 3px rgba(229,154,170,0.15)" : "none",
          cursor: "pointer",
          "&:hover": { borderColor: "#E59AAA" },
        }),
        option: (base, state) => ({
          ...base,
          background: state.isSelected ? "#E59AAA" : state.isFocused ? "#FFF0F4" : "#fff",
          color: state.isSelected ? "#fff" : "#1A1A1A",
          fontSize: kecil ? 13 : 14,
          cursor: "pointer",
        }),
        multiValue: (base) => ({ ...base, background: "#FFF0F4", borderRadius: 14 }),
        multiValueLabel: (base) => ({ ...base, color: "#9B4A5A", fontSize: 12 }),
        multiValueRemove: (base) => ({
          ...base, color: "#9B4A5A", borderRadius: 14,
          "&:hover": { background: "#E59AAA", color: "#fff" },
        }),
        indicatorSeparator: () => ({ display: "none" }),
        menu: (base) => ({ ...base, borderRadius: 12, overflow: "hidden" }),
        menuPortal: (base) => ({ ...base, zIndex: 1100 }),
      }}
    />
  )
}

export default Dropdown
