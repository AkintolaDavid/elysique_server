// const multer = require("multer");
// const path = require("path");

// // Set storage for files
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads"); // Specify the upload folder
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
//   },
// });

// // Initialize upload with a file size limit if necessary
// const upload = multer({ storage });

// module.exports = upload;
