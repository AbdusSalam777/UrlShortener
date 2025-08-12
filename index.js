import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { nanoid } from "nanoid";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== MONGO CONNECTION =====
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ===== MODEL =====
const urlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
});

const Url = mongoose.model("Url", urlSchema);

// ===== ROUTES =====

// Shorten URL with optional custom word
app.post("/shorten", async (req, res) => {
  const { longUrl, customWord } = req.body;
  if (!longUrl) {
    return res.status(400).json({ error: "Long URL is required" });
  }

  try {
    let shortId = customWord?.trim() || nanoid(7);

    // Check if custom word already exists
    const exists = await Url.findOne({ shortId });
    if (exists) {
      return res.status(400).json({ error: "Custom short word already in use" });
    }

    const newUrl = new Url({ shortId, originalUrl: longUrl });
    await newUrl.save();

    res.json({ shortUrl: `${process.env.BASE_URL}/${shortId}` });
  } catch (error) {
    console.error("Error shortening URL:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Redirect to original URL
app.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;
    const urlDoc = await Url.findOne({ shortId });

    if (urlDoc) {
      return res.redirect(urlDoc.originalUrl);
    }
    res.status(404).json({ error: "URL not found" });
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
