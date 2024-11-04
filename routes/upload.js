const multer = require("multer");
const path = require("path");

// Set storage for files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Specify the upload folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
  },
});

// Initialize upload
const upload = multer({ storage });

// Export the upload function
module.exports = {
  imageUpload: upload.array("images"), // Handles multiple image uploads
  videoUpload: upload.single("video"), // Handles single video upload
};
