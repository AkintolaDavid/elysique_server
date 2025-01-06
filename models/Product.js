// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  type: { type: String, required: true },
  productNumber: {
    type: String,
  },
  description: { type: String, required: true },
  images: { type: [String], required: true },
  videoUrl: { type: String },
  sizeQuantities: { type: Map, of: Number }, // e.g., { S: 10, M: 5, L: 2 }
  quantity: { type: Number, default: 0 }, // New field for products without sizes
});

module.exports = mongoose.model("Product", productSchema);
