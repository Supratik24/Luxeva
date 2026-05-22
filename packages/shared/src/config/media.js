import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "../middleware/errorHandler.js";

let configured = false;

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
};

const getCloudinary = () => {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new ApiError(500, "Cloudinary is not configured");
  }

  if (!configured) {
    cloudinary.config(config);
    configured = true;
  }

  return cloudinary;
};

export const isCloudinaryConfigured = () => Boolean(getCloudinaryConfig());

export const isRemoteImageUrl = (value = "") => /^https?:\/\//i.test(String(value).trim());

export const isCloudinaryUrl = (value = "") => /res\.cloudinary\.com/i.test(String(value).trim());

export const uploadImageToCloudinary = async (source, options = {}) => {
  const client = getCloudinary();
  const result = await client.uploader.upload(source, {
    folder: options.folder || "luxeva",
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height
  };
};

export const normalizeImageUrl = async (value, options = {}) => {
  const imageUrl = String(value || "").trim();
  if (!imageUrl || isCloudinaryUrl(imageUrl)) {
    return imageUrl;
  }

  if (!isRemoteImageUrl(imageUrl)) {
    if (!isCloudinaryConfigured()) {
      throw new ApiError(500, "Cloudinary is not configured for file uploads");
    }
  }

  if (!isCloudinaryConfigured()) {
    return imageUrl;
  }

  const uploaded = await uploadImageToCloudinary(imageUrl, options);
  return uploaded.url;
};

export const normalizeImageRecord = async (image, options = {}) => {
  if (!image) {
    return image;
  }

  if (typeof image === "string") {
    return {
      url: await normalizeImageUrl(image, options),
      alt: options.alt || ""
    };
  }

  return {
    ...image,
    url: await normalizeImageUrl(image.url, options)
  };
};

export const normalizeImageRecords = async (images = [], options = {}) =>
  Promise.all(images.map((image) => normalizeImageRecord(image, options)));
