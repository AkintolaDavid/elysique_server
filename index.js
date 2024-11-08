// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");
const productRoutes = require("./routes/products");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const app = express();
const bcrypt = require("bcrypt");
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  console.log("Token received:", token);

  if (!token) {
    return res
      .status(403)
      .json({ message: "Please log in before submitting the form!" });
  }

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err);
      return res
        .status(401)
        .json({ message: "Invalid token! Please log in again." });
    }

    req.userId = decoded.id; // Change to 'id' since the token contains 'id' not 'userId'
    console.log("Token verified. User ID:", decoded.id);
    next();
  });
};
const allowedOrigins = [
  "http://localhost:3000",
  "https://elysique.vercel.app",
  "https://elysique.onrender.com",
];

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization",
    credentials: true,
  })
);

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
app.post("/api/signup", async (req, res) => {
  const { email, phone, password, fullName } = req.body;

  console.log("Received signup request with fullName:", fullName);

  try {
    // Check if the password is less than 6 characters
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    console.log("User found:", existingUser);

    if (existingUser) {
      if (existingUser.phone === phone) {
        return res
          .status(400)
          .json({ message: "Phone number is already registered" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email is already registered" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      phone,
      password: hashedPassword,
      fullName,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    console.log(
      "User registered successfully with fullName:",
      newUser.fullName
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        phone: newUser.phone,
        fullName: newUser.fullName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      // Specify message for non-existent user
      return res.status(400).json({ message: "Email not registered" });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      // Specify message for incorrect password
      return res.status(400).json({ message: "Invalid password" });
    }

    console.log("Login successful for user:", existingUser.email);
    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    console.log(token);
    return res.status(200).json({
      message: "Login successful",
      token,
      fullName: existingUser.fullName,
      email: existingUser.email, // Add this line to send the email
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/search", async (req, res) => {
  const { query } = req.query;

  try {
    // Find products that match the search query in their name or description
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error searching products", error });
  }
});
app.post("/api/verify-payment", async (req, res) => {
  const { reference } = req.body;
  if (!reference) {
    return res
      .status(400)
      .json({ message: "Transaction reference is missing" });
  }
  console.log(process.env.PAYSTACK_SECRET_KEY);
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`, // Use your Paystack secret key here
        },
      }
    );

    const { data } = response;

    if (data.status === true && data.data.status === "success") {
      return res.json({ status: "success", data: data.data });
    } else {
      return res.json({ status: "failure", message: "Payment not successful" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: "Error verifying payment" });
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
app.post("/api/forgotpassword", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send("User not found");
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m", // Token expires in 15
  });

  // Set the reset token and its expiration in the user document
  user.resetToken = token;
  user.resetTokenExpiration = Date.now() + 900000; // 15 minutes

  // Save the updated user with the token and expiration
  await user.save();

  // URL for resetting password, sent to the user's email
  const resetUrl = `https://elysique.vercel.app/reset-password/${token}`;

  // Send reset password email with nodemailer
  try {
    await transporter.sendMail({
      to: email,
      subject: "ALLURE Password Reset",
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
          Reset ALLURE password
          </td>
        </tr>
        <tr>
          <td
            style="
              padding: 20px;
              font-size: 25px;
              font-weight: 700;
              color: black;
              text-align: center;
            "
          >
          You have requested for password reset. Please click the link below to change your password. 
          </td>
        </tr>
      
        <tr>
          <td style="padding: 10px 20px; font-size: 14px; font-weight: 700; color: black; text-align: center;">
          <a
          href="${resetUrl}"
          style="
            color: red;
            text-decoration: underline;
            font-size: 21px;
            font-weight: bold;
            
          "
        >
          Change Password
        </a> </tr>
    
        
        <tr>
          <td style="padding: 10px 20px; font-size: 14px; color: #777; text-align: center;">
            This email was generated automatically. Please do not reply directly.
          </td>
        </tr>
      </table>
    </div>
    

    
      `,
    });
    res.send("Password reset email sent");
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).send("Error sending reset email");
  }
});

// Reset password route
app.post("/api/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Check if the password has at least 6 characters
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).send("Password must be at least 6 characters long");
  }

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch (err) {
    return res.status(400).send("Invalid or expired token");
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).send("Invalid or expired token");
  }

  if (user.resetTokenExpiration < Date.now()) {
    return res.status(400).send("Invalid or expired token");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = undefined; // Clear the reset token
  user.resetTokenExpiration = undefined; // Clear the expiration date
  await user.save();

  res.send("Password has been reset");
});
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
