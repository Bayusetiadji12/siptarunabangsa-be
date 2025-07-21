import bookService from "../service/book-service.js";

const getAllBook = async (req, res, next) => {
  try {
    const request = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };
    const result = await bookService.getAllBook(request);
    res.status(200).json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getDetailBook = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    const result = await bookService.getDetailBook(bookId);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createBook = async (req, res, next) => {
  try {
    const request = {
      code: req.body.code,
      title: req.body.title,
      author: req.body.author,
      publisher: req.body.publisher,
      year: req.body.year,
      location: req.body.location,
      description: req.body.description,
      isbn: req.body.isbn,
      status: req.body.status,
      stock: req.body.stock,
      source: req.body.source
    };
    const cover = req.file;

    let categories = [];
    const rawCategories = req.body.categories ?? req.body.category;

    if (Array.isArray(rawCategories)) {
      categories = rawCategories;
    } else if (typeof rawCategories === "string") {
      try {
        const parsed = JSON.parse(rawCategories);
        categories = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        categories = [rawCategories];
      }
    }

    console.log("📦 Final categories = ", categories);

    const result = await bookService.createBook(request, cover, categories);
    res.status(201).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;

    const request = {
      code: req.body.code,
      title: req.body.title,
      author: req.body.author,
      publisher: req.body.publisher,
      year: req.body.year,
      location: req.body.location,
      description: req.body.description,
      isbn: req.body.isbn,
      status: req.body.status,
      stock: req.body.stock,
      source: req.body.source,
    };

    const cover = req.file;
    const removeCover = req.body.removeCover === "true" || req.body.removeCover === true;

    console.log("req.body.categories =", req.body.categories);
    console.log("req.body.category =", req.body.category);

    // Proses parsing kategori
    let categories = [];
    const rawCategories = req.body.categories ?? req.body.category;

    if (Array.isArray(rawCategories)) {
      categories = rawCategories;
    } else if (typeof rawCategories === "string") {
      try {
        const parsed = JSON.parse(rawCategories);
        categories = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        categories = [rawCategories];
      }
    }

    const result = await bookService.updateBook(bookId, request, cover, categories, removeCover);

    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

// const searchBook = async (req, res, next) => {
//   try {
//     const keyword = req.query.keyword || "";
//     const result = await bookService.searchBook(keyword);
//     res.status(200).json({
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const searchBook = async (req, res, next) => {
//   try {
//     const { keyword, category } = req.query;
//     const result = await bookService.searchBook(keyword, category);
//     res.status(200).json({ data: result });
//   } catch (error) {
//     next(error);
//   }
// };

const searchBook = async (req, res, next) => {
  try {
    const keyword = req.query.keyword || "";
    const field = req.query.field || "title"; // "title" | "author" | "publisher"
    const category = req.query.category || "";

    const books = await bookService.searchBook(keyword, field, category);
    res.status(200).json({ data: books });
  } catch (err) {
    next(err);
  }
};


const getBooksByCategory = async (req, res, next) => {
  try {
    const categoryName = req.params.categoryName;
    const result = await bookService.getBooksByCategory(categoryName);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    await bookService.deleteBook(bookId);
    res.status(200).json({
      status: "OK",
    });
  } catch (error) {
    next(error);
  }
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
