const express = require("express");
const router = express.Router();
const { fileUpload } = require("../controllers/uploadController");
const upload = require("../middleware/uploadMiddleweare");

router.post("/upload",upload.single("file"), fileUpload);
router.post("/multiple",upload.array("files",10), fileUpload);
router.post ("/testing", (req, res) => {
   res.send("Route is all set");
})
module.exports = router;
