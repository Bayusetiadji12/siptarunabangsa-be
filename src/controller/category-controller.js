import categoryService from "../service/category-service.js";

const getAllCategory = async (req, res, next) => {
  try {
    const request = {
      query: req.query.query,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };
    const result = await categoryService.getAllCategory(request);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const request =  {
      name: req.body.name,
    };
    const image = req.file;
    const result = await categoryService.createCategory(request, image);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error)
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const request = {
      name: req.body.name,
    };
    const image = req.file;
    const result = await categoryService.updateCategory(
      categoryId,
      request,
      image,
    );
    res.status(200).json({
      data: result,
    })
  } catch (error) {
    next(error);
  }
}

const searchCategory = async (req, res, next) => {
  try {
    const keyword = req.query.keyword || "";
    const result = await categoryService.searchCategory(keyword);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    await categoryService.deleteCategory(categoryId);
    res.status(200).json({
      status: "OK",
    });
  } catch (error) {
    next(error);
  }
};

export default {
    getAllCategory,
    createCategory,
    updateCategory,
    searchCategory,
    deleteCategory,
};
