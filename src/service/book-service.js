import fs from "fs";
import cloudinary from "../application/cloudinary.js";
import { prismaClient } from "../application/db.js";
import { ResponseError } from "../error/response-error.js";
import {
  createBookValidation,
  getBookValidation,
  updateBookValidation,
} from "../validation/book-validation.js";
import { kmpSearch } from "../util/kmp.js";
import { validate } from "../validation/validation.js";

const getAllBook = async (request) => {
  request = validate(getBookValidation, request);

  const pageNumber = request.page || 1;
  const limitNumber = request.limit || 12;
  const offset = (pageNumber - 1) * limitNumber;
  const sortBy = request.sortBy || "title";
  const sortOrder = request.sortOrder || "asc";

  const books = await prismaClient.book.findMany({
    skip: offset,
    take: limitNumber,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      categories: true,
    },
  });

  const totalBooks = await prismaClient.book.count();

  return {
    data: books,
    pagination: {
      page: pageNumber,
      total_page: Math.ceil(totalBooks / limitNumber),
      total_books: totalBooks,
    },
  };
};

const getDetailBook = async (bookId) => {
  const book = await prismaClient.book.findUnique({
    where: {
      id: bookId,
    },
    include: {
      categories: true,
    },
  });

  if (!book) {
    throw new ResponseError(404, "Buku tidak ditemukan");
  }

  return book;
};

const createBook = async (request, cover, categories) => {
  request = validate(createBookValidation, request);

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    throw new ResponseError(400, "category is required");
  }

  let imageUrl = null;
  if (cover) {
    const uploadResponse = await cloudinary.uploader.upload(cover.path, {
      folder: "sip-book",
    });
    imageUrl = uploadResponse.secure_url;
    await fs.promises.unlink(cover.path);
  }

  const categoryRecords = await prismaClient.category.findMany({
    where: {
      name: { in: categories },
    },
    select: {
      id: true,
    },
  });

  if (categoryRecords.length !== categories.length) {
  throw new ResponseError(404, "Kategori tidak ditemukan");
  }
  
  const newBook = await prismaClient.book.create({
    data: {
      code: request.code,
      title: request.title,
      author: request.author,
      publisher: request.publisher,
      year: request.year,
      location: request.location,
      cover: imageUrl,
      description: request.description,
      isbn: request.isbn,
      status: "TERSEDIA",
      categories: {
        connect: categoryRecords.map((cat) => ({ id: cat.id })),
      },
      stock: request.stock || 1,
      source: "PEMBELIAN",
    },
    include: {
    categories: true, // ✅ Tambahkan ini
    },
  });

  return newBook;
};

// const updateBook = async (bookId, request, cover, categories) => {

//   request = validate(updateBookValidation, request);

//   const removeCover = request.removeCover === true || request.removeCover === "true";

//   const existingBook = await prismaClient.book.findUnique({
//     where: { id: bookId },
//     include: { categories: true },
//   });

//   if (!existingBook) {
//     throw new ResponseError(404, "Buku tidak ditemukan");
//   }

//   let imageUrl = existingBook.cover;
  
// if (removeCover && existingBook.cover) {
//   const publicId = existingBook.cover.split("/").pop().split(".")[0];
//   await cloudinary.uploader.destroy(`sip-book/${publicId}`);
//   imageUrl = null;
// }
//   if (cover) {
//     if (existingBook.cover) {
//       const publicId = existingBook.cover.split("/").pop().split(".")[0];
//       await cloudinary.uploader.destroy(`sip-book/${publicId}`);
//     }

//     const uploadResponse = await cloudinary.uploader.upload(cover.path, {
//       folder: "sip-book",
//     });
//     imageUrl = uploadResponse.secure_url;

//     await fs.promises.unlink(cover.path);
//   }

//   let categoryConnect = [];
//   if (categories && Array.isArray(categories)) {
//     const filtered = categories.filter((c) => typeof c === "string" && c.trim() !== "");
//     const categoryRecords = await prismaClient.category.findMany({
//       where: { name: { in: filtered } },
//       select: { id: true },
//     });

//     if (categoryRecords.length !== filtered.length) {
//       throw new ResponseError(404, "Kategori tidak ditemukan");
//     }

//     categoryConnect = categoryRecords.map((cat) => ({ id: cat.id }));
//   }

//   const updatedBook = await prismaClient.book.update({
//     where: { id: bookId },
//     data: {
//       cover: imageUrl,
//       ...request,
//       categories: {
//         set: [], // reset
//         connect: categoryConnect,
//       },
//     },
//       include: {
//     categories: true, // ✅ ini yang harus ditambahkan
//   },
//   });

//   return updatedBook;
// };

const updateBook = async (bookId, request, cover, categories = [], removeCover = false) => {
  request = validate(updateBookValidation, request);

  const existingBook = await prismaClient.book.findUnique({
    where: { id: bookId },
    include: { categories: true },
  });

  if (!existingBook) {
    throw new ResponseError(404, "Buku tidak ditemukan");
  }

  let imageUrl = existingBook.cover;

  // 🔽 Hapus cover jika diminta
  if (removeCover && existingBook.cover) {
    const publicId = existingBook.cover.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`sip-book/${publicId}`);
    imageUrl = null;
  }

  // 🔽 Upload cover baru jika ada
  if (cover) {
    if (existingBook.cover) {
      const publicId = existingBook.cover.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`sip-book/${publicId}`);
    }

    const uploadResponse = await cloudinary.uploader.upload(cover.path, {
      folder: "sip-book",
    });

    imageUrl = uploadResponse.secure_url;
    await fs.promises.unlink(cover.path); // hapus file lokal
  }

  // 🔽 Proses kategori
  let categoryConnect = [];
  if (categories && Array.isArray(categories)) {
    const filtered = categories.filter((c) => typeof c === "string" && c.trim() !== "");
    const categoryRecords = await prismaClient.category.findMany({
      where: { name: { in: filtered } },
      select: { id: true },
    });

    if (categoryRecords.length !== filtered.length) {
      throw new ResponseError(404, "Kategori tidak ditemukan");
    }

    categoryConnect = categoryRecords.map((cat) => ({ id: cat.id }));
  }

  const updatedBook = await prismaClient.book.update({
    where: { id: bookId },
    data: {
      ...request,
      cover: imageUrl,
      categories: {
        set: [], // reset kategori sebelumnya
        connect: categoryConnect,
      },
    },
    include: {
      categories: true,
    },
  });

  return updatedBook;
};

const searchBook = async (keyword, field = "title", categoryName = "") => {
  const books = await prismaClient.book.findMany({
    where: categoryName
      ? {
          categories: {
            some: { name: categoryName },
          },
        }
      : {},
    include: {
      categories: true,
    },
  });

  const lowerKeyword = keyword.toLowerCase();

  const matchedBooks = books.filter((book) => {
    const fieldValue = (book[field] || "").toString().toLowerCase();
    return kmpSearch(fieldValue, lowerKeyword);
  });

  if (matchedBooks.length === 0) {
    throw new ResponseError(404, "Buku tidak ditemukan");
  }

  return matchedBooks;
};


// const searchBook = async (keyword) => {
//   const books = await prismaClient.book.findMany();
//   const lowerKeyword = keyword.toLowerCase();

//   const matchedBooks = books.filter((book) =>
//     kmpSearch(book.title.toLowerCase(), lowerKeyword) ||
//     kmpSearch(book.author.toLowerCase(), lowerKeyword) ||
//     kmpSearch((book.publisher || "").toLowerCase(), lowerKeyword)
//   );

//   if (matchedBooks.length === 0) {
//     throw new Error("Buku tidak ditemukan");
//   }

//   return matchedBooks;
// };

// const searchBook = async (keyword) => {
//   const books = await prismaClient.book.findMany();
//   const lowerKeyword = keyword.toLowerCase();

//   console.log("Keyword:", lowerKeyword);
//   console.log("Books:", books.map(book => book.title));

//   const result = books.filter((book) =>
//     book.title.toLowerCase().includes(lowerKeyword)
//   );

//   console.log("Matched:", result.map(book => book.title));

//   return result;
// };

//   const getBooksByCategory = async (categoryName) => {
//   const category = await prismaClient.category.findUnique({
//     where: { name: categoryName },
//     include: {
//       books: {
//         include: { categories: true },
//       },
//     },
//   });

//   if (!category) {
//     throw new ResponseError(404, "Kategori tidak ditemukan");
//   }

//   return category.books;
// };
const getBooksByCategory = async (categoryName, page = 1, limit = 12) => {
  const offset = (page - 1) * limit;

  const category = await prismaClient.category.findUnique({
    where: { name: categoryName },
    include: {
      books: {
        skip: offset,
        take: limit,
        include: { categories: true },
      },
    },
  });

  const totalBooks = await prismaClient.book.count({
    where: {
      categories: {
        some: { name: categoryName },
      },
    },
  });

  return {
    data: category.books,
    pagination: {
      page,
      total_page: Math.ceil(totalBooks / limit),
      total_books: totalBooks,
    },
  };
};


const deleteBook = async (bookId) => {
  const book = await prismaClient.book.findUnique({
    where: {
      id: bookId,
    },
  });

  if (!book) {
    throw new ResponseError(404, "Buku tidak ditemukan");
  }

  if (book.cover) {
    const publicId = book.cover.split("/").pop().split(".")[0]; 
    if (publicId) {
      await cloudinary.uploader.destroy(`sip-book/${publicId}`);
    }
    }
  return prismaClient.book.delete({
    where: {
      id: bookId,
    },
  });
};

export default {
  getAllBook,
  getDetailBook,
  createBook,
  updateBook,
  searchBook,
  getBooksByCategory,
  deleteBook,
};
