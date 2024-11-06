const express = require("express");
const router = express.Router();
const db = require("../db");

// Create a new product
router.post("/", async (req, res) => {
  const {
    name,
    price,
    category,
    type,
    description,
    images,
    videoUrl,
    sizeQuantities,
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO products (name, price, category, type, description, images, video_url, size_quantities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        name,
        price,
        category,
        type,
        description,
        images,
        videoUrl,
        sizeQuantities,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ error: "Error saving product." });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products");
    res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a product by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM products WHERE id = $1", [id]);
    res.status(200).json({ message: "Product deleted successfully!" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Error deleting product." });
  }
});

module.exports = router;
