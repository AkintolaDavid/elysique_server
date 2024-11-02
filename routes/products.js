const express = require("express");
const router = express.Router();
const Product = require("../models/Product"); // Your Product model
const upload = require("./upload");
const cloudinary = require("../config/cloudinary"); // Import the Cloudinary configuration

router.post(
  "/",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 5 },
    { name: "videoUrl", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("req.files:", req.files);
      console.log("req.body:", req.body);

      const { name, price, category, type, description, sizeQuantities } =
        req.body;

      // Initialize variables for image paths
      let mainImage = "";
      if (req.files["mainImage"] && req.files["mainImage"].length > 0) {
        const uploadResult = await cloudinary.uploader.upload(
          req.files["mainImage"][0].path
        );
        mainImage = uploadResult.secure_url; // Get URL from Cloudinary
      }

      const additionalImages = req.files["additionalImages"]
        ? await Promise.all(
            req.files["additionalImages"].map(async (file) => {
              const uploadResult = await cloudinary.uploader.upload(file.path);
              return uploadResult.secure_url; // Get URL from Cloudinary
            })
          )
        : [];

      let videoUrl = "";
      if (req.files["videoUrl"] && req.files["videoUrl"].length > 0) {
        const uploadResult = await cloudinary.uploader.upload(
          req.files["videoUrl"][0].path
        );
        videoUrl = uploadResult.secure_url; // Get URL from Cloudinary
      }

      const newProduct = new Product({
        name,
        price,
        category,
        type,
        mainImage,
        additionalImages,
        videoUrl,
        description,
        sizeQuantities: sizeQuantities ? JSON.parse(sizeQuantities) : {},
      });

      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);
router.get("/", async (req, res) => {
  const { category, type } = req.query;
  const query = {};

  // Add category and type to query if they exist and are not "All"
  if (category) query.category = category;
  if (type && type !== "All") query.type = type;

  try {
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Error fetching products" });
  }
});

// GET /api/products/:id - Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Error fetching product" });
  }
});

// DELETE /api/products/:id - Delete a product by ID
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
});

module.exports = router;
