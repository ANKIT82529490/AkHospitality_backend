import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI is not defined in environment variables");
    }

    // Prevent multiple connections (important for dev / hot reload)
    if (mongoose.connection.readyState === 1) {
      console.log("⚡ MongoDB already connected");
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "your_db_name", // optional
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); // stop server if DB fails
  }
};

// Connection event listeners
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB Disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB Reconnected");
});

export default connectDB;
