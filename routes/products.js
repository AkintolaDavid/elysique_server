const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Create a new product
router.post("/", async (req, res) => {
  const {
    name,
    price,
    category,
    type,
    productNumber,
    description,
    images,
    videoUrl,
    sizeQuantities,
  } = req.body;

  try {
    const newProduct = new Product({
      name,
      price,
      category,
      type,
      productNumber,
      description,
      images,
      videoUrl,
      sizeQuantities,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ error: "Error saving product." });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const { category, type } = req.query;

    const query = {};
    if (category) query.category = category;
    if (type && type !== "All") query.type = type;

    const products = await Product.find(query);
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: "Error fetching products." });
  }
});
// Product search route (you can add this to your routes for searching products by number)
router.get("/:productNumber", async (req, res) => {
  try {
    const product = await Product.findOne({
      productNumber: req.params.productNumber,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});
router.get("/:number", async (req, res) => {
  const { number } = req.params;
  try {
    const product = await Product.find({
      number: { $regex: new RegExp(`^${number}`), $options: "i" }, // Partial match
    });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product", error: err });
  }
});

router.get("/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching product" });
  }
});

// Delete a product by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully!" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Error deleting product." });
  }
});

module.exports = router;
