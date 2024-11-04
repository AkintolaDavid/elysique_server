const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  type: String,
  images: [String],
  videoUrl: String,
  description: String,
  sizeQuantities: Object,
});

module.exports = mongoose.model("Product", productSchema);
