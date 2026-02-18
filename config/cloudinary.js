import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = () => {
  try {
    const { CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY } = process.env;

    if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_SECRET_KEY) {
      throw new Error("Cloudinary environment variables are missing");
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_SECRET_KEY,
      secure: true, // Always use HTTPS
    });

    console.log("✅ Cloudinary configured successfully");

  } catch (error) {
    console.error("❌ Cloudinary configuration failed:", error.message);
    process.exit(1);
  }
};

export default connectCloudinary;
