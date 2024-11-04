const express = require("express");
const router = express.Router();
const Product = require("../models/Product"); // Product model
const upload = require("./upload"); // Multer upload middleware
const cloudinary = require("../config/cloudinary"); // Cloudinary configuration

router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 5 }, // Upload field for images
    { name: "video", maxCount: 1 }, // Upload field for video
  ]),
  async (req, res) => {
    try {
      console.log("req.files:", req.files); // Debugging output
      console.log("req.body:", req.body);

      const { name, price, category, type, description, sizeQuantities } =
        req.body;

      // Upload images to Cloudinary if provided
      const images = req.files["images"]
        ? await Promise.all(
            req.files["images"].map(async (file) => {
              const uploadResult = await cloudinary.uploader.upload(file.path);
              return uploadResult.secure_url; // Get URL from Cloudinary
            })
          )
        : [];

      // Upload video to Cloudinary if provided
      let videoUrl = "";
      if (req.files && req.files["video"] && req.files["video"].length > 0) {
        const uploadResult = await cloudinary.uploader.upload(
          req.files["video"][0].path,
          {
            resource_type: "video",
          }
        );
        videoUrl = uploadResult.secure_url; // Get URL from Cloudinary
      }

      // Create a new Product instance and save to MongoDB
      const newProduct = new Product({
        name,
        price,
        category,
        type,
        images, // Updated to use images array
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
