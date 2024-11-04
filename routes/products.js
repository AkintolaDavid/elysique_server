const express = require("express");
const router = express.Router();
const db = require("../config/mongoConfig");
const { imageUpload, videoUpload } = require("../middleware/multerConfig");

// Route to add new product
router.post("/", imageUpload, videoUpload, (req, res) => {
  // Check for uploaded files
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: "No files were uploaded." });
  }

  const { name, price, category, type, description, sizeQuantities } = req.body;

  const imageUrls = req.files?.map((file) => file.path);
  const videoUrl = req.file ? req.file.path : ""; // Use req.file for the video upload

  const newProduct = {
    name,
    price,
    category,
    type,
    description,
    images: imageUrls,
    videoUrl,
    sizeQuantities: JSON.parse(sizeQuantities),
  };

  db.products.insert(newProduct, (err, product) => {
    if (err) return res.status(500).json({ error: "Error saving product." });
    res.status(201).json(product);
  });
});

// Route to get all products
router.get("/", (req, res) => {
  db.products.find((err, products) => {
    if (err) return res.status(500).json({ error: "Error fetching products." });
    res.status(200).json(products);
  });
});

// Route to delete a product by ID
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.products.remove({ _id: mongojs.ObjectId(id) }, (err, result) => {
    if (err) return res.status(500).json({ error: "Error deleting product." });
    res.status(200).json({ message: "Product deleted successfully!" });
  });
});

module.exports = router;
