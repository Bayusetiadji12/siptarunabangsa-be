import { Router } from "express";
import { isAdmin,isAuthorized } from "../middleware/auth-middleware.js";
import userController from "../controller/user-controller.js";
import categoryController from "../controller/category-controller.js";
import bookController from "../controller/book-controller.js";
import borrowController from "../controller/borrow-controller.js";
import upload from "../middleware/upload.js";

const authorizedRouter = Router();
authorizedRouter.use(isAuthorized);

// User API
authorizedRouter.get("/api/users/search", userController.searchUser);
authorizedRouter.get("/api/users",isAdmin, userController.getAllUser);
authorizedRouter.get("/api/users/me", userController.getUserProfile);
authorizedRouter.put("/api/users/:userId", upload.single("image"), userController.updateUser);
authorizedRouter.delete("/api/users/logout", userController.logoutUser);
authorizedRouter.delete("/api/users/:userId",isAdmin, userController.deleteUser);

// Category API
authorizedRouter.get("/api/categorys/search", categoryController.searchCategory);
authorizedRouter.get("/api/categorys", categoryController.getAllCategory);
authorizedRouter.delete("/api/categorys/:categoryId", categoryController.deleteCategory);
authorizedRouter.post("/api/categorys", upload.single("image"), isAdmin, categoryController.createCategory);
authorizedRouter.put("/api/categorys/:categoryId", upload.single("image"), categoryController.updateCategory);

// Book API
authorizedRouter.get("/api/books/search", bookController.searchBook);
authorizedRouter.get("/api/books/category/:categoryName", bookController.getBooksByCategory);
authorizedRouter.get("/api/books", bookController.getAllBook);
authorizedRouter.get("/api/books/:bookId", bookController.getDetailBook);
authorizedRouter.post("/api/books", upload.single("cover"), bookController.createBook);
authorizedRouter.put("/api/books/:bookId", upload.single("cover"), bookController.updateBook);
authorizedRouter.delete("/api/books/:bookId", bookController.deleteBook);

// Borrow API
authorizedRouter.get("/api/borrows/search", borrowController.searchBorrow);
authorizedRouter.get("/api/borrows", borrowController.getAllBorrow);
authorizedRouter.get("/api/borrows/user", borrowController.getBorrowHistoryByUser);
authorizedRouter.get("/api/borrows/:borrowId", borrowController.getDetailBorrow);
authorizedRouter.post("/api/borrows", borrowController.createBorrow);
authorizedRouter.put("/api/borrows/:id/return", borrowController.returnBorrow);
authorizedRouter.delete("/api/borrows/:borrowId", borrowController.deleteBorrow);

export { authorizedRouter };