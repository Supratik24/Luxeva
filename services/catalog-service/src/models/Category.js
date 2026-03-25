import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    image: String,
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;

