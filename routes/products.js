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
router.put("/updatequantity/:id", async (req, res) => {
  try {
    const { size, quantity } = req.body; // size and quantity are expected from the request body

    // Find the product by ID
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    // Handle product with sizes (if applicable)
    if (product.sizeQuantities && size) {
      // Ensure enough stock is available for the selected size
      if (product.sizeQuantities[size] >= quantity) {
        product.sizeQuantities[size] -= quantity; // Decrease stock for the selected size
      } else {
        return res
          .status(400)
          .send({ message: "Not enough stock for the selected size" });
      }
    } else {
      // Handle products without size options
      if (product.quantity >= quantity) {
        product.quantity -= quantity; // Decrease the total stock quantity
      } else {
        return res
          .status(400)
          .send({ message: "Not enough stock for this product" });
      }
    }

    // Save the updated product details
    await product.save();

    // Send success response
    res.status(200).send({ message: "Quantity updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error updating product quantity" });
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
