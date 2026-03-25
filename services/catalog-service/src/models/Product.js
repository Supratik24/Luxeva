import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    size: String,
    color: String,
    sku: String,
    stock: { type: Number, default: 0 }
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: String
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: String,
    description: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    images: [imageSchema],
    price: { type: Number, required: true },
    compareAtPrice: Number,
    discountPercent: { type: Number, default: 0 },
    sku: { type: String, required: true, unique: true },
    stock: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    tags: [String],
    colors: [String],
    sizes: [String],
    variants: [variantSchema],
    specs: {
      material: String,
      fit: String,
      warranty: String,
      care: String,
      origin: String
    },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    flashSaleEndsAt: Date,
    seo: {
      title: String,
      description: String
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;

