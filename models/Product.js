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
  quantity: {
    type: Number,
    default: 0, // For products that don't have sizes
  },
  sizeQuantities: {
    type: Map,
    of: Number, // For size-specific products (e.g. S, M, L, etc.)
    default: {},
  },
});

module.exports = mongoose.model("Product", productSchema);
