import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import nodemailer from "nodemailer";
import { PRODUCTS } from "./product.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ⚠️ Replace with your own Paystack Secret Key
const PAYSTACK_SECRET_KEY = "sk_live_ab3ce6be17c04fb11cb02722db2ee72e04abe12a";

// ⚠️ Replace with your Gmail + App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "taiwoemmanuel435@gmail.com",
    pass: "zwjlmsrwpjimfrxw", // Gmail App Password, not normal password
  },
});

// Store locked totals, purchased items & customer email
let lockedTotalUSD = 0;
let purchasedBooks = [];
let customerEmail = "";

app.use(cors());
app.use(bodyParser.json());

// ✅ Products endpoint
app.get("/products", (req, res) => {
  res.json(PRODUCTS);
});

// ✅ Checkout → register selected books and total
app.post("/checkout", (req, res) => {
  const { books, total } = req.body;
  lockedTotalUSD = parseFloat(total);
  purchasedBooks = books; // [{ name, price, book, qty }]
  console.log("✅ Checkout registered. USD Total:", lockedTotalUSD);
  console.log("🛒 Books:", purchasedBooks);

  res.json({ redirect: "./pay.html" });
});

// ✅ Conversion (USD → NGN)
app.get("/conversion-rate", async (req, res) => {
  try {
    const response = await axios.get("https://open.er-api.com/v6/latest/USD");
    const rate = response.data.rates.NGN;
    const nairaAmount = (lockedTotalUSD * rate).toFixed(2);

    res.json({
      rate,
      totalUSD: lockedTotalUSD,
      totalNGN: nairaAmount,
    });
  } catch (err) {
    console.error("Conversion API error:", err.message);
    res.status(500).json({ error: "Failed to fetch conversion rate" });
  }
});

// ✅ Initialize Paystack payment
app.post("/api/pay", async (req, res) => {
  try {
    const { email } = req.body;
    customerEmail = email; // store email for sending later

    const conversion = await axios.get("https://open.er-api.com/v6/latest/USD");
    const rate = conversion.data.rates.NGN;
    const amount = Math.round(lockedTotalUSD * rate * 100);

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount,
        callback_url: "https://store-kqh0.onrender.com/payment-success",
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

// ✅ After payment success → allow download + send email
app.get("/payment-success", async (req, res) => {
  console.log("🎉 Payment verified. Preparing download + email...");

  if (!purchasedBooks || purchasedBooks.length === 0) {
    return res.send("⚠️ No books found for this order.");
  }

  // Create temp ZIP file
  const zipName = `order_${Date.now()}.zip`;
  const zipPath = path.join(process.cwd(), zipName);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(output);

  const orderFolder = `order_${Date.now()}`;
  purchasedBooks.forEach((item) => {
    const filePath = path.join(process.cwd(), "books", item);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: `${orderFolder}/${item}` });
    }
  });

  archive.finalize();

  // When ZIP ready → send email
  output.on("close", async () => {
    try {
      await transporter.sendMail({
        from: '"Magical Store" <yourgmail@gmail.com>',
        to: customerEmail,
        subject: "📚 Your Magical Books Have Arrived!",
        text: "Thank you for your purchase. Please find your books attached.",
        attachments: [{ filename: zipName, path: zipPath }],
      });

      console.log(`📩 Books sent to ${customerEmail}`);
      fs.unlinkSync(zipPath); // delete temp file after sending
    } catch (err) {
      console.error("Email sending failed:", err.message);
    }
  });

  // Show download page (instant access)
  res.send(`
    <html>
      <body style="background:#000; color:#fff; text-align:center; padding:50px;">
        <h2>🎉 Payment Successful!</h2>
        <p>Your magical books are ready. They are downloading now & also sent to your email: <b>${customerEmail}</b></p>
        <button id="downloadBtn"
          style="padding:15px 30px; background:#9b59b6; color:#fff; border:none; border-radius:10px; cursor:pointer;">
          ⬇ Download Again
        </button>
        <script>
          function downloadBooks() {
            fetch("https://store-kqh0.onrender.com/download")
              .then(res => res.blob())
              .then(blob => {
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = "my_books.zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              });
          }
          // Auto-download once
          downloadBooks();
          document.getElementById("downloadBtn").addEventListener("click", downloadBooks);
        </script>
      </body>
    </html>
  `);
});

// ✅ /download → serve books as ZIP
app.get("/download", (req, res) => {
  if (!purchasedBooks || purchasedBooks.length === 0) {
    return res.status(400).send("No purchased books found.");
  }

  const zipName = `bundle_${Date.now()}.zip`;
  res.attachment(zipName);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  const orderFolder = `order_${Date.now()}`;
  purchasedBooks.forEach((item) => {
    const filePath = path.join(process.cwd(), "books", item);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: `${orderFolder}/${item}` });
    }
  });

  archive.finalize();
});

// 🚀 Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`)
);
