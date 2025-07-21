import { prismaClient } from "../application/db.js";
import { ResponseError } from "../error/response-error.js";
import {
  getBorrowValidation,
  createBorrowValidation,
  returnBorrowValidation,
} from "../validation/borrow-validation.js";
import { kmpSearch } from "../util/kmp.js";
import { validate } from "../validation/validation.js";

const createBorrow = async (request) => {
  request = validate(createBorrowValidation, request);

  const user = await prismaClient.user.findUnique({
    where: { id: request.user_id },
  });

  if (!user) throw new ResponseError(404, "User tidak ditemukan");

  const book = await prismaClient.book.findUnique({
    where: { id: request.book_id },
  });

  if (!book) throw new ResponseError(404, "Buku tidak ditemukan");
  if (book.status === "DIPINJAM" || book.stock < 1)
    throw new ResponseError(400, "Buku tidak tersedia");

  // Update stok buku
  await prismaClient.book.update({
    where: { id: request.book_id },
    data: {
      stock: { decrement: 1 },
      status: book.stock - 1 === 0 ? "DIPINJAM" : book.status,
    },
  });

  const borrow = await prismaClient.borrow.create({
    data: {
      user_id: request.user_id,
      book_id: request.book_id,
      dueDate: request.dueDate,
    },
  });

  return borrow;
};

const returnBorrow = async (borrowId, request) => {
  request = validate(returnBorrowValidation, request);

  const borrow = await prismaClient.borrow.findUnique({
    where: { id: borrowId },
    include: { book: true },
  });

  if (!borrow) throw new ResponseError(404, "Data peminjaman tidak ditemukan");
  if (borrow.status === "DIKEMBALIKAN" || borrow.status === "HILANG")
    throw new ResponseError(400, "Buku sudah dikembalikan atau dinyatakan hilang");

  let updatedStatus = request.status;
  if (!["HILANG", "DIKEMBALIKAN", "TERLAMBAT"].includes(updatedStatus)) {
    // fallback jika status tidak dikirim (misalnya frontend lama)
    const isLate = new Date() > borrow.dueDate;
    updatedStatus = isLate ? "TERLAMBAT" : "DIKEMBALIKAN";
  }
//   if (!["HILANG", "DIKEMBALIKAN", "TERLAMBAT"].includes(updatedStatus)) {
//   updatedStatus = undefined; // kosongkan agar validasi tidak salah
// }

  const updated = await prismaClient.borrow.update({
    where: { id: borrowId },
    data: {
      returnDate: request.returnDate,
      status: updatedStatus,
    },
  });

  if (updatedStatus === "HILANG") {
    // Kurangi stok 1 (hilang permanen)
    await prismaClient.book.update({
      where: { id: borrow.book_id },
      data: {
        stock: { decrement: 1 },
        status: borrow.book.stock - 1 <= 0 ? "DIPINJAM" : "TERSEDIA",
      },
    });
  } else {
    // Buku dikembalikan, stok bertambah
    await prismaClient.book.update({
      where: { id: borrow.book_id },
      data: {
        stock: { increment: 1 },
        status: "TERSEDIA",
      },
    });
  }

  return updated;
};


const getAllBorrow = async (request) => {
  request = validate(getBorrowValidation, request);

  const pageNumber = request.page || 1;
  const limitNumber = request.limit || 10;
  const offset = (pageNumber - 1) * limitNumber;
  const sortBy = request.sortBy || "borrowDate"; // default sort by tanggal pinjam
  const sortOrder = request.sortOrder || "desc"; // default descending

  const borrows = await prismaClient.borrow.findMany({
    skip: offset,
    take: limitNumber,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: true,
      book: true,
    },
  });

  const totalBorrows = await prismaClient.borrow.count();

  return {
    data: borrows,
    pagination: {
      page: pageNumber,
      total_page: Math.ceil(totalBorrows / limitNumber),
      total_borrows: totalBorrows,
    },
  };
};

const getDetailBorrow = async (borrowId) => {
  if (!borrowId) throw new ResponseError(400, "ID peminjaman wajib diisi");

  const borrow = await prismaClient.borrow.findUnique({
    where: { id: borrowId },
    include: {
      user: true,
      book: true,
    },
  });

  if (!borrow) throw new ResponseError(404, "Data peminjaman tidak ditemukan");

  return borrow;
};

const getBorrowHistoryByUser = async (userId) => {
  if (!userId) throw new ResponseError(400, "User ID tidak valid");

  const borrows = await prismaClient.borrow.findMany({
    where: { user_id: userId },
    orderBy: { borrowDate: "desc" },
    include: {
      book: true,
    },
  });

  return borrows;
};

const searchBorrow = async (keyword, field = "user") => {
  const borrows = await prismaClient.borrow.findMany({
    include: {
      user: true,
      book: true,
    },
  });

  const lowerKeyword = keyword.toLowerCase();

  const matchedBorrows = borrows.filter((borrow) => {
    let fieldValue = "";

    if (field === "user") {
      fieldValue = borrow.user?.name || "";
    } else if (field === "book") {
      fieldValue = borrow.book?.title || "";
    } else if (field === "status") {
      fieldValue = borrow.status || "";
    }

    return kmpSearch(fieldValue.toLowerCase(), lowerKeyword);
  });

  if (matchedBorrows.length === 0) {
    throw new ResponseError(404, "Data peminjaman tidak ditemukan");
  }

  return matchedBorrows;
};

const deleteBorrow = async (borrowId) => {

  const borrow = await prismaClient.borrow.findUnique({
    where: { id: borrowId },
    include: { book: true },
  });

  if (!borrow) throw new ResponseError(404, "Data peminjaman tidak ditemukan");

  // Jika buku belum dikembalikan, kembalikan stok dan status buku
  if (borrow.status === "DIPINJAM" || borrow.status === "TERLAMBAT") {
    await prismaClient.book.update({
      where: { id: borrow.book.id },
      data: {
        stock: { increment: 1 },
        status: "TERSEDIA",
      },
    });
  }

  await prismaClient.borrow.delete({
    where: { id: borrowId },
  });

  return {
    message: "Data peminjaman berhasil dihapus",
  };
};


export default {
  createBorrow,
  returnBorrow,
  getAllBorrow,
  getDetailBorrow,
  getBorrowHistoryByUser,
  searchBorrow,
  deleteBorrow, 
};