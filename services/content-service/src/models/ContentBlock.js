import mongoose from "mongoose";

const contentBlockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    title: String,
    subtitle: String,
    items: [mongoose.Schema.Types.Mixed],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const ContentBlock = mongoose.model("ContentBlock", contentBlockSchema);

export default ContentBlock;

