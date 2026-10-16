import { ApiError, asyncHandler, normalizeImageUrl, sendSuccess } from "@luxeva/shared";
import Banner from "../models/Banner.js";
import ContentBlock from "../models/ContentBlock.js";
import Subscriber from "../models/Subscriber.js";
import Campaign from "../models/Campaign.js";
import mongoose from "mongoose";

const normalizeBannerPayload = async (payload) => {
  const nextPayload = { ...payload };
  if (nextPayload.image) {
    nextPayload.image = await normalizeImageUrl(nextPayload.image, { folder: "luxeva/banners" });
  }
  return nextPayload;
};

export const getHomeContent = asyncHandler(async (req, res) => {
  if (process.env.CONTENT_FALLBACK_MODE === "memory" || mongoose.connection.readyState !== 1) {
    sendSuccess(res, 200, "Content fetched successfully", {
      banners: [],
      testimonials: [],
      faq: [],
      pages: []
    });
    return;
  }

  const [banners, testimonials, faq, pages] = await Promise.all([
    Banner.find({ active: true }).sort({ order: 1 }),
    ContentBlock.findOne({ key: "testimonials", active: true }),
    ContentBlock.findOne({ key: "faq", active: true }),
    ContentBlock.find({ key: { $in: ["about", "terms", "privacy"] }, active: true })
  ]);

  sendSuccess(res, 200, "Content fetched successfully", {
    banners,
    testimonials: testimonials?.items || [],
    faq: faq?.items || [],
    pages
  });
});

export const getPageContent = asyncHandler(async (req, res) => {
  const page = await ContentBlock.findOne({ key: req.params.slug, active: true });
  if (!page) {
    throw new ApiError(404, "Content page not found");
  }

  sendSuccess(res, 200, "Page content fetched successfully", { page });
});

export const getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ order: 1 });
  sendSuccess(res, 200, "Banners fetched successfully", { banners });
});

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(await normalizeBannerPayload(req.body));
  sendSuccess(res, 201, "Banner created successfully", { banner });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, await normalizeBannerPayload(req.body), {
    new: true,
    runValidators: true
  });
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }
  sendSuccess(res, 200, "Banner updated successfully", { banner });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  sendSuccess(res, 200, "Banner deleted successfully");
});

export const getBlocks = asyncHandler(async (req, res) => {
  const blocks = await ContentBlock.find().sort({ updatedAt: -1 });
  sendSuccess(res, 200, "Content blocks fetched successfully", { blocks });
});

export const upsertBlock = asyncHandler(async (req, res) => {
  const block = await ContentBlock.findOneAndUpdate(
    { key: req.body.key },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );
  sendSuccess(res, 200, "Content block saved successfully", { block });
});

// In-memory fallback stores for subscribers and campaigns
let mockSubscribers = [
  {
    _id: "sub_1",
    email: "elena.v@luxurydesign.com",
    status: "subscribed",
    source: "storefront_footer",
    subscribedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    _id: "sub_2",
    email: "marcus.chen@studio.co",
    status: "subscribed",
    source: "storefront_footer",
    subscribedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    _id: "sub_3",
    email: "sophia.r@voguearchive.com",
    status: "subscribed",
    source: "storefront_footer",
    subscribedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    _id: "sub_4",
    email: "clara.m@heritagecrafts.io",
    status: "subscribed",
    source: "storefront_footer",
    subscribedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString()
  }
];

let mockCampaigns = [
  {
    _id: "camp_1",
    subject: "The Autumn Edit: Handcrafted Silks & Minimal Timepieces",
    title: "Seasonal Release 2026",
    message: "Discover our latest private drop featuring Italian silk shirts, cashmere scarves, and minimalist analog watches.",
    category: "private_drop",
    actionUrl: "/shop",
    actionText: "Shop the Autumn Edit",
    recipientCount: 4,
    status: "sent",
    sentAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }

  const isMemoryMode = process.env.CONTENT_FALLBACK_MODE === "memory" || mongoose.connection.readyState !== 1;

  if (isMemoryMode) {
    const existing = mockSubscribers.find((s) => s.email.toLowerCase() === email);
    if (existing) {
      if (existing.status === "subscribed") {
        return sendSuccess(res, 200, "You're already subscribed to the Luxeva newsletter!", {
          subscriber: existing,
          alreadySubscribed: true
        });
      }
      existing.status = "subscribed";
      existing.subscribedAt = new Date().toISOString();
      return sendSuccess(res, 200, "Welcome back! Your subscription has been reactivated.", {
        subscriber: existing,
        reactivated: true
      });
    }

    const newSub = {
      _id: `sub_${Date.now()}`,
      email,
      status: "subscribed",
      source: req.body?.source || "storefront_footer",
      tags: ["general", "storefront"],
      subscribedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    mockSubscribers.unshift(newSub);
    return sendSuccess(res, 201, "Thank you for subscribing to Luxeva! The latest edits will arrive in your inbox.", {
      subscriber: newSub
    });
  }

  // MongoDB mode
  let subscriber = await Subscriber.findOne({ email });
  if (subscriber) {
    if (subscriber.status === "subscribed") {
      return sendSuccess(res, 200, "You're already subscribed to the Luxeva newsletter!", {
        subscriber,
        alreadySubscribed: true
      });
    }
    subscriber.status = "subscribed";
    subscriber.subscribedAt = new Date();
    await subscriber.save();
    return sendSuccess(res, 200, "Welcome back! Your subscription has been reactivated.", {
      subscriber,
      reactivated: true
    });
  }

  subscriber = await Subscriber.create({
    email,
    status: "subscribed",
    source: req.body?.source || "storefront_footer",
    subscribedAt: new Date()
  });

  sendSuccess(res, 201, "Thank you for subscribing to Luxeva! The latest edits will arrive in your inbox.", {
    subscriber
  });
});

export const getSubscribers = asyncHandler(async (req, res) => {
  const isMemoryMode = process.env.CONTENT_FALLBACK_MODE === "memory" || mongoose.connection.readyState !== 1;
  const search = String(req.query?.search || "").trim().toLowerCase();

  if (isMemoryMode) {
    let filtered = [...mockSubscribers];
    if (search) {
      filtered = filtered.filter((s) => s.email.toLowerCase().includes(search));
    }
    const activeCount = mockSubscribers.filter((s) => s.status === "subscribed").length;
    return sendSuccess(res, 200, "Subscribers fetched successfully", {
      subscribers: filtered,
      total: mockSubscribers.length,
      activeCount
    });
  }

  const query = {};
  if (search) {
    query.email = { $regex: search, $options: "i" };
  }

  const [subscribers, total, activeCount] = await Promise.all([
    Subscriber.find(query).sort({ createdAt: -1 }),
    Subscriber.countDocuments(),
    Subscriber.countDocuments({ status: "subscribed" })
  ]);

  sendSuccess(res, 200, "Subscribers fetched successfully", {
    subscribers,
    total,
    activeCount
  });
});

export const deleteSubscriber = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMemoryMode = process.env.CONTENT_FALLBACK_MODE === "memory" || mongoose.connection.readyState !== 1;

  if (isMemoryMode) {
    mockSubscribers = mockSubscribers.filter((s) => s._id !== id);
    return sendSuccess(res, 200, "Subscriber removed successfully");
  }

  await Subscriber.findByIdAndDelete(id);
  sendSuccess(res, 200, "Subscriber removed successfully");
});

export const getCampaigns = asyncHandler(async (req, res) => {
  const isMemoryMode = process.env.CONTENT_FALLBACK_MODE === "memory" || mongoose.connection.readyState !== 1;

  if (isMemoryMode) {
    return sendSuccess(res, 200, "Campaigns fetched successfully", {
      campaigns: mockCampaigns
    });
  }

  const campaigns = await Campaign.find().sort({ sentAt: -1 });
  sendSuccess(res, 200, "Campaigns fetched successfully", { campaigns });
});

export const sendCampaign = asyncHandler(async (req, res) => {
  const { subject, title, message, category, actionUrl, actionText } = req.body;

  if (!subject || !message) {
    throw new ApiError(400, "Subject and campaign message are required.");
  }

  const isMemoryMode = process.env.CONTENT_FALLBACK_MODE === "memory" || mongoose.connection.readyState !== 1;

  let activeSubscribersCount = 0;
  if (isMemoryMode) {
    activeSubscribersCount = mockSubscribers.filter((s) => s.status === "subscribed").length;
    const newCampaign = {
      _id: `camp_${Date.now()}`,
      subject,
      title: title || subject,
      message,
      category: category || "announcement",
      actionUrl: actionUrl || "/shop",
      actionText: actionText || "Explore Collection",
      recipientCount: activeSubscribersCount,
      status: "sent",
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    mockCampaigns.unshift(newCampaign);

    return sendSuccess(res, 201, `Broadcast campaign successfully sent to ${activeSubscribersCount} subscribers!`, {
      campaign: newCampaign,
      recipientCount: activeSubscribersCount
    });
  }

  activeSubscribersCount = await Subscriber.countDocuments({ status: "subscribed" });

  const campaign = await Campaign.create({
    subject,
    title: title || subject,
    message,
    category: category || "announcement",
    actionUrl: actionUrl || "/shop",
    actionText: actionText || "Explore Collection",
    recipientCount: activeSubscribersCount,
    status: "sent",
    sentAt: new Date()
  });

  sendSuccess(res, 201, `Broadcast campaign successfully sent to ${activeSubscribersCount} subscribers!`, {
    campaign,
    recipientCount: activeSubscribersCount
  });
});

