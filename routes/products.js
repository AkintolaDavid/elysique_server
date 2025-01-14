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
    quantity,
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
      quantity,
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
router.put("/updatequantity/:productId", async (req, res) => {
  console.log(req.params.productId);
  const { productId } = req.params;
  const { size, quantity } = req.body;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (size) {
      // Update size-specific quantity
      if (product.sizeQuantities.has(size)) {
        product.sizeQuantities.set(
          size,
          product.sizeQuantities.get(size) + quantity
        );
      } else {
        product.sizeQuantities.set(size, quantity);
      }
    } else {
      // Update general quantity
      product.quantity += quantity;
    }

    await product.save();

    res
      .status(200)
      .json({ success: true, message: "Product quantity updated", product });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
});

// Product search route (you can add this to your routes for searching products by number)
router.get("/:productNumber", async (req, res) => {
  try {
    const product = await Product.findOne({
      productNumber: req.params.productNumber,
    });
    if (!product) {
      console.log("Product not found.");
      return res.status(404).json({ message: "Product not found." });
    }
    res.json(product);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/get/:productId", async (req, res) => {
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
