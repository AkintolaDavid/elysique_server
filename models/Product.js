// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], required: true },
  videoUrl: { type: String },
  sizeQuantities: { type: Map, of: Number }, // e.g., { S: 10, M: 5, L: 2 }
});

module.exports = mongoose.model("Product", productSchema);
