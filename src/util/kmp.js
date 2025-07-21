const buildKMPTable = (pattern) => {
  const table = Array(pattern.length).fill(0); // Membuat array dengan panjang pattern dan diisi 0
  let prefixLen = 0; // Panjang prefix yang cocok saat ini

  for (let i = 1; i < pattern.length; i++) {
    while (prefixLen > 0 && pattern[i] !== pattern[prefixLen]) {
      prefixLen = table[prefixLen - 1]; // Mundur ke nilai LPS sebelumnya
    }

    if (pattern[i] === pattern[prefixLen]) {
      prefixLen++; // Jika cocok, tambah panjang prefix
    }

    table[i] = prefixLen; // Simpan panjang prefix ke dalam tabel
  }

  return table;
};

const kmpSearch = (text, pattern) => {
  if (!pattern || pattern.length === 0) return true;  // Jika pola kosong, dianggap cocok

  const table = buildKMPTable(pattern); // Bangun tabel prefix
  let j = 0; // Index untuk pattern

  for (let i = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== pattern[j]) {
      j = table[j - 1];  // Jika tidak cocok, gunakan tabel untuk melompat
    }

    if (text[i] === pattern[j]) {
      j++; // Karakter cocok, lanjutkan ke karakter berikutnya
    }

    if (j === pattern.length) {
      return true; // Semua karakter pola cocok, pattern ditemukan
    }
  }

  return false; // Pattern tidak ditemukan
};

export { buildKMPTable, kmpSearch };