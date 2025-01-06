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
router.post("/updatequantity", async (req, res) => {
  const { productId, size, quantity } = req.body;
  try {
    // Find the product by ID
    const product = await Product.findById(productId);
    console.log(`$productttt${product}`);
    console.log(`$${product.sizeQuantities}`);
    console.log(`size${size}`);
    console.log(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // If the product has sizeQuantities (size-specific quantities), handle that
    if (product.sizeQuantities && size) {
      const currentSizeQuantity = product.sizeQuantities.get(size) || 0;
      if (currentSizeQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient quantity in stock for the selected size",
        });
      }
      product.sizeQuantities.set(size, currentSizeQuantity - quantity);
    }
    // If there is no sizeQuantities (general quantity), handle general quantity update
    else if (product.quantity !== undefined) {
      if (product.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient quantity in stock",
        });
      }
      product.quantity -= quantity;
    } else {
      // If no quantity is available at all
      return res.status(400).json({
        success: false,
        message: "Product does not have a valid stock quantity",
      });
    }

    // Save the updated product
    await product.save();
    res.json({
      success: true,
      message: "Product quantity updated successfully",
    });
  } catch (error) {
    console.error("Error updating product quantity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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
