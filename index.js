// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");
const Otp = require("./models/Otp");
const productRoutes = require("./routes/products");
const axios = require("axios");
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
  try {
    // Validation for password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
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

    // Remove manual hashing and let the pre-save hook hash the password
    const newUser = new User({
      email,
      phone,
      password: hashedPassword,
      fullName,
    });

    await newUser.save();

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
      return res.status(400).json({ message: "Email not registered" });
    }

    // Use bcrypt.compare with await to avoid Promise issues
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    return res.status(200).json({
      message: "Login successful",
      token,
      fullName: existingUser.fullName,
      email: existingUser.email,
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
  service: "gmail",
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
      subject: "Elysique New Contact Form Submission",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f1f2f4;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff; text-align: center; border-collapse: collapse; border-radius: 10px; overflow: hidden;">
        
        <!-- Header Section -->
        <tr>
          <td style="background-color: #252526; color: white; padding: 20px; font-size: 23px; font-weight: 600;">
            ELYSIQUE Contact Form Submission
          </td>
        </tr>
        
        <!-- Body Section -->
        <tr>
          <td style="padding: 20px; font-size: 24px; font-weight: 700; color: #333; text-align: left;">
            You have received a new message from:
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; font-size: 18px; font-weight: 600; color: #333; text-align: left;">
            Name: <span style="font-weight: 400;">${name}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; font-size: 18px; font-weight: 600; color: #333; text-align: left;">
            Email: <a href="mailto:${email}" style="color: #4caf50; text-decoration: none; font-weight: 400;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; font-size: 18px; font-weight: 600; color: #333; text-align: left;">
            Message:
          </td>
        </tr>
        <tr>
          <td style="padding: 15px 20px; background-color: #f9f9f9; font-size: 16px; color: #333; text-align: left; line-height: 1.6;">
            ${message}
          </td>
        </tr>
        
        <!-- Footer Section -->
        <tr>
          <td style="padding: 15px 20px; font-size: 14px; color: #777; text-align: left; border-top: 1px solid #ddd;">
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
        style="
          max-width: 600px;
          margin: 0 auto;
          background-color: #fff;
          text-align: center;
          border-collapse: collapse;
          border-radius: 10px;
          overflow: hidden;
        "
      >
        <!-- Header Section -->
        <tr>
          <td
            style="
              background-color: #252526;
              color: white;
              padding: 20px;
              font-size: 23px;
              font-weight: 600;
            "
          >
            Reset ELYSIQUE Password
          </td>
        </tr>
    
        <!-- Body Section -->
        <tr>
          <td
            style="
              padding: 20px;
              font-size: 20px;
              font-weight: 600;
              color: #333;
              text-align: left;
            "
          >
            You have requested a password reset. Please click the button below to change your password.
          </td>
        </tr>
    
        <!-- Reset Button Section -->
        <tr>
          <td style="padding: 20px; text-align: center;">
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                background-color: #ff4d4d;
                color: white;
                padding: 15px 25px;
                text-decoration: none;
                font-size: 18px;
                font-weight: bold;
                border-radius: 5px;
              "
            >
              Change Password
            </a>
          </td>
        </tr>
    
        <!-- Footer Section -->
        <tr>
          <td style="padding: 15px 20px; font-size: 14px; color: #777; text-align: center; border-top: 1px solid #ddd;">
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

app.post("/api/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Validate new password length
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
  if (!user || user.resetTokenExpiration < Date.now()) {
    return res.status(400).send("Invalid or expired token");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = undefined; // Clear the reset token
  user.resetTokenExpiration = undefined; // Clear the expiration date
  await user.save();

  res.send("Password has been reset");
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  house_address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  products: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      size: String,
      imageUrl: [String], // Include image URL
    },
  ],
  totalAmount: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema);

app.post("/api/orders", async (req, res) => {
  try {
    console.log(req.body); // Log the request body to check incoming data

    const {
      customerName,
      customerEmail,
      house_address,
      city,
      state,
      country,
      products,
      totalAmount,
      orderDate, // This is coming as a string from the frontend
      urgentDelivery,
    } = req.body;

    // Convert orderDate to a Date object
    const parsedOrderDate = new Date(orderDate);

    // Validate that the parsed date is valid
    if (isNaN(parsedOrderDate.getTime())) {
      return res.status(400).json({ message: "Invalid order date format." });
    }

    // Create a new order with the parsed date
    const newOrder = new Order({
      customerName,
      customerEmail,
      house_address,
      city,
      state,
      country,
      products,
      totalAmount,
      orderDate: parsedOrderDate, // Use the converted Date object
      urgentDelivery,
    });

    await newOrder.save();
    res
      .status(201)
      .json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Error placing order:", error); // Log the error for better context
    res.status(500).json({ message: "Failed to place order", error });
  }
});

app.get("/api/getorders", async (req, res) => {
  try {
    let query = {};

    const orders = await Order.find(query);

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
const sendOtpToEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Use your email provider's SMTP service
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password or app password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "ELYSIQUE OTP Code",
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
          ELYSIQUE OTP Code
          </td>
        </tr>
        <tr>
          <td
            style="
              padding: 20px;
              font-size: 32px;
              font-weight: 700;
              color: black;
              text-align: center;
            "
          >
          Here's your one-time code for ALLURE
          </td>
        </tr>
      
        <tr>
          <td style="padding: 10px 20px; font-size: 14px; font-weight: 700; color: black; text-align: center;">
          Use this passcode to verify the email address of Admin. It will expire in 10 minutes.   </td>
        </tr>
        <tr>
          <td style="padding: 10px 20px; font-size: 22px; font-weight: 700; color: black; text-align: center;">
          ${otp}
          </td>
        </tr>
        
        <tr>
          <td style="padding: 10px 20px; font-size: 14px; color: #777; text-align: center;">
            This email was generated automatically. Please do not reply directly.
          </td>
        </tr>
      </table>
    </div>
    

    
      `,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  // const adminEmail = "nkemdilimoganah@gmail.com";
  const adminEmail = "akintoladavid66@gmail.com";

  // Log emails for debugging
  console.log("Received email:", email);
  console.log("Admin email from environment:", adminEmail);

  // Check if the email matches the admin email in the environment variable
  if (email !== process.env.ADMINEMAIL) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter admin email" });
  }

  const otp = Math.floor(1000 + Math.random() * 9000);
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // OTP expires in 10 minutes

  // Save the OTP and expiration time in the database
  const otpEntry = new Otp({ email, otp, expiresAt });
  await otpEntry.save();

  try {
    // Send the OTP to the email
    await sendOtpToEmail(email, otp);
    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error sending OTP" });
  }
});
app.post("/api/sendUrgentDeliveryEmail", (req, res) => {
  const orderData = req.body.orderData;

  // Set up the transporter using your email provider's SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can use another email provider
    auth: {
      user: process.env.ADMIN_EMAIL, // The admin email address
      pass: process.env.ADMIN_EMAIL_PASSWORD, // Email password or app-specific password
    },
  });

  // Create the email content
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // The sender's email
    to: "akintoladavid66@gmail.com", // Admin's email
    subject: "Urgent Delivery Request",
    text: `An order has been placed with urgent delivery:

      Order Date: ${orderData.orderDate}
      Total Amount: ₦${orderData.totalAmount.toFixed(2)}
      
      Products:
      ${orderData.products
        .map((product) => `${product.name} (x${product.quantity})`)
        .join("\n")}

      Customer Details:
      Name: ${orderData.customerName}
      Address: ${orderData.house_address}, ${orderData.city}, ${
      orderData.state
    }, ${orderData.country}

      Urgent Delivery: Yes

      Please review the order and process it accordingly.`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).send("Error sending email.");
    }
    console.log("Email sent: " + info.response);
    res.status(200).send("Email sent successfully.");
  });
});
app.post("/api/verify-otp", async (req, res) => {
  const { otp } = req.body;
  try {
    const otpRecord = await Otp.findOne({ otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const now = new Date();
    if (otpRecord.expiresAt < now) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    const token = jwt.sign(
      { role: "admin", email: otpRecord.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Try to delete OTP and catch any errors related to deletion
    try {
      await Otp.deleteOne({ _id: otpRecord._id });
    } catch (deleteError) {
      console.error("Error deleting OTP:", deleteError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to delete OTP after verification",
      });
    }

    // Return the token upon successful OTP verification
    return res.json({
      success: true,
      token,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
