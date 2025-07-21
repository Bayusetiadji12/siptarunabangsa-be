import { ResponseError } from "../error/response-error.js";
import borrowService from "../service/borrow-service.js";

const createBorrow = async (req, res, next) => {
  try {
    const result = await borrowService.createBorrow(req.body);
    res.status(201).json({ message: "Berhasil meminjam buku", data: result });
  } catch (error) {
    next(error);
  }
};

const returnBorrow = async (req, res, next) => {
  try {
    const result = await borrowService.returnBorrow(req.params.id, req.body);
    res.json({ message: "Buku berhasil dikembalikan", data: result });
  } catch (error) {
    next(error);
  }
};

const getAllBorrow = async (req, res, next) => {
  try {
    const request = {
      query: req.query.query,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };
    const result = await borrowService.getAllBorrow(request);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getDetailBorrow = async (req, res, next) => {
  try {
    const borrowId = req.params.borrowId;
    const result = await borrowService.getDetailBorrow(borrowId);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getBorrowHistoryByUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await borrowService.getBorrowHistoryByUser(userId);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

const searchBorrow = async (req, res, next) => {
  try {
    const { keyword, field } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Keyword pencarian wajib diisi" });
    }

    const results = await borrowService.searchBorrow(keyword, field || "user");
    return res.status(200).json({
      message: "Hasil pencarian berhasil ditemukan",
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

const deleteBorrow = async (req, res, next) => {
  try {
    const borrowId = req.params.id;
    const result = await borrowService.deleteBorrow(borrowId);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
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