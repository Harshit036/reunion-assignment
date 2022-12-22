const express = require("express");
const { check } = require("express-validator");

const postsControllers = require("../controllers/posts-controllers");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/:pid", postsControllers.getPostById);

// router.get("/user/:uid", postsControllers.getPostsByUserId);

router.use(checkAuth);

router.post(
  "/",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  postsControllers.createPlace
);

router.post("/:pid", placesControllers.likePlace);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
