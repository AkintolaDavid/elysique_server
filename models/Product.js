const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  type: String,
  mainImage: String,
  additionalImages: [String],
  videoUrl: String,
  description: String,
  sizeQuantities: {
    type: Map,
    of: Number,
  },
});

module.exports = mongoose.model("Product", productSchema);
