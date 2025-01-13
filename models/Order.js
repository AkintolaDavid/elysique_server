const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  phoneNumber: { type: Number, required: true },
  house_address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

      name: String,
      price: Number,
      quantity: Number,
      size: String,
      imageUrl: [String], // Include image URL
    },
  ],
  totalAmount: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
  urgentDelivery: { type: Boolean, default: false },
});
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
