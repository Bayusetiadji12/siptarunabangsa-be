import userService from "../service/user-service.js";

const register = async (req, res, next) => {
  try {
    const result = await userService.register(req.body);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await userService.getUserProfile(userId);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await userService.logoutUser(userId);
    res.status(200).json({
      status: "OK",
    });
  } catch (error) {
    next(error);
  }
};

const getAllUser = async (req, res, next) => {
  try {
    const request = {
      query: req.query.query,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };
    const result = await userService.getAllUser(request);
    res.status(200).json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const request = req.body;
    const image = req.file; 

    const loggedInUser = req.user;

    // Hanya admin atau user itu sendiri yang boleh update
    const isAdmin = loggedInUser.is_admin === true;
    const isOwner = loggedInUser.id === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const result = await userService.updateUser(
      userId, 
      request, 
      image,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

const searchUser = async (req, res, next) => {
  try {
    const keyword = req.query.keyword || "";
    const result = await userService.searchUser(keyword);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await userService.deleteUser(userId);
    res.status(200).json({
      status: "OK",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getUserProfile,
  logoutUser,
  getAllUser,
  updateUser,
  searchUser,
  deleteUser,
};
