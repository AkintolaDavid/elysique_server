// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const productRoutes = require("./routes/products");

const app = express();

const corsOptions = {
  origin: "*", // Temporarily allow all origins for debugging
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log("MongoDB connection error:", error));

// Routes
app.use("/api/products", productRoutes);
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail", // or another email service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).send("All fields are required.");
  }

  try {
    await transporter.sendMail({
      to: process.env.EMAIL_USER, // Send to the admin's email
      subject: "Allure New Contact Form Submission",
      html: `
      <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 10px;
        background-color: #f1f2f4;
      "
    >
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="max-width: 600px; margin: 0 auto; background-color: #fff; text-align: center; border-collapse: collapse;"
      >
        <tr>
          <td
            style="
              background-color: #252526;
              color: white;
              padding: 20px;
              font-size: 23px;
              font-weight: 600;
              border-top-left-radius: 12px;
              border-top-right-radius: 12px;
            "
          >
            ALLURE Contact Form Submission
          </td>
        </tr>
        <tr>
          <td
            style="
              padding: 20px;
              font-size: 32px;
              font-weight: 700;
              color: black;
              text-align: left;
            "
          >
            You have received a new message from:
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; font-size: 22px; font-weight: 700; color: black; text-align: left;">
            Name: ${name}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; font-size: 22px; font-weight: 700; color: black; text-align: left;">
            Email: <a href="mailto:${email}" style="color: #4caf50;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; font-size: 22px; font-weight: 700; color: black; text-align: left;">
            Message:
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; background-color: #f9f9f9; font-size: 22px; color: black; text-align: left;">
            ${message}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; font-size: 14px; color: #777; text-align: left;">
            This email was generated automatically. Please do not reply directly.
          </td>
        </tr>
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
