// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const productRoutes = require("./routes/products");
const nodemailer = require("nodemailer");

const app = express();

// Configure CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://elysique.vercel.app",
    "https://elysique.onrender.com",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});
app.use(express.json());

// Connect to MongoDB using Mongoose
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Routes
app.use("/api/products", productRoutes);
app.get("/api/users", async (req, res) => {
  console.log("Received request for users");
  try {
    const users = await User.find(); // Assuming you have a User model
    res.json(users); // Send users as response
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Nodemailer configuration for contact form
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send("All fields are required.");
  }

  try {
    await transporter.sendMail({
      to: process.env.EMAIL_USER,
      subject: "Allure New Contact Form Submission",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f1f2f4;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff; text-align: center; border-collapse: collapse;">
            <tr><td style="background-color: #252526; color: white; padding: 20px; font-size: 23px; font-weight: 600; border-top-left-radius: 12px; border-top-right-radius: 12px;">ALLURE Contact Form Submission</td></tr>
            <tr><td style="padding: 20px; font-size: 32px; font-weight: 700; color: black; text-align: left;">You have received a new message from:</td></tr>
            <tr><td style="padding: 10px 20px; font-size: 22px; font-weight: 700; color: black; text-align: left;">Name: ${name}</td></tr>
            <tr><td style="padding: 10px 20px; font-size: 22px; font-weight: 700; color: black; text-align: left;">Email: <a href="mailto:${email}" style="color: #4caf50;">${email}</a></td></tr>
            <tr><td style="padding: 10px 20px; font-size: 22px; font-weight: 700; color: black; text-align: left;">Message:</td></tr>
            <tr><td style="padding: 10px 20px; background-color: #f9f9f9; font-size: 22px; color: black; text-align: left;">${message}</td></tr>
            <tr><td style="padding: 10px 20px; font-size: 14px; color: #777; text-align: left;">This email was generated automatically. Please do not reply directly.</td></tr>
          </table>
        </div>
      `,
    });
    res.status(200).send({ message: "Contact message sent successfully!" });
  } catch (err) {
    console.error("Error sending email:", err);
    return res.status(500).send("Error sending contact message.");
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
