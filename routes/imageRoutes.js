const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

router.use(authMiddleware);
const imageController = require("../controllers/imageController");

router
  .route("/")
  .get(imageController.getAllImages)
  .post(imageController.createImage);

router
  .route("/:id")
  .get(imageController.getImageById)
  .put(imageController.updateImage)
  .delete(imageController.deleteImage);

module.exports = router;
