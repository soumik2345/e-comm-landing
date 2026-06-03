"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import SiteConfig from "@/models/SiteConfig";

const HEADER_BANNER_MESSAGE_KEY = "headerBannerMessage";
const HEADER_BANNER_IMAGE_KEY = "headerBannerImage";
const SERVICE_CARDS_KEY = "serviceCards";

type HeaderBannerConfig = {
  message: string;
  image: string;
};

type ServiceCardItem = {
  icon: string;
  title: string;
  description: string;
};

const defaultServiceCards: ServiceCardItem[] = [
  { icon: "🚚", title: "Fast Delivery", description: "Get your order delivered quickly with reliable tracking updates." },
  { icon: "📦", title: "Secure Packing", description: "Products are packed carefully to arrive in perfect condition." },
  { icon: "💬", title: "Bangla Support", description: "Friendly local support in Bangla for every order question." },
  { icon: "💰", title: "Cash on Delivery", description: "Pay when you receive the package, with no online payment required." },
];

export async function getHeaderBanner(): Promise<HeaderBannerConfig> {
  await dbConnect();
  const [messageConfig, imageConfig] = await Promise.all([
    SiteConfig.findOne({ key: HEADER_BANNER_MESSAGE_KEY }).lean(),
    SiteConfig.findOne({ key: HEADER_BANNER_IMAGE_KEY }).lean(),
  ]);

  return {
    message: messageConfig?.value || "",
    image: imageConfig?.value || "",
  };
}

export async function getServiceCards(): Promise<ServiceCardItem[]> {
  await dbConnect();
  const config = await SiteConfig.findOne({ key: SERVICE_CARDS_KEY }).lean();
  if (!config?.value) {
    return defaultServiceCards;
  }

  try {
    const saved = JSON.parse(config.value);
    if (!Array.isArray(saved)) return defaultServiceCards;
    return saved
      .map((item) => ({
        icon: String(item?.icon || "") || "⭐",
        title: String(item?.title || "").trim(),
        description: String(item?.description || "").trim(),
      }))
      .filter((item) => item.title && item.description);
  } catch {
    return defaultServiceCards;
  }
}

export async function saveHeaderBanner(formData: FormData) {
  const message = String(formData.get("message") || "").trim();
  const image = String(formData.get("image") || "").trim();
  await dbConnect();

  if (message) {
    await SiteConfig.findOneAndUpdate(
      { key: HEADER_BANNER_MESSAGE_KEY },
      { value: message },
      { upsert: true }
    );
  } else {
    await SiteConfig.findOneAndDelete({ key: HEADER_BANNER_MESSAGE_KEY });
  }

  if (image) {
    await SiteConfig.findOneAndUpdate(
      { key: HEADER_BANNER_IMAGE_KEY },
      { value: image },
      { upsert: true }
    );
  } else {
    await SiteConfig.findOneAndDelete({ key: HEADER_BANNER_IMAGE_KEY });
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveServiceCards(formData: FormData) {
  const cardsMap = new Map<number, Partial<ServiceCardItem>>();

  for (const [key, value] of formData.entries()) {
    const match = /^service(Icon|Title|Description)[-_]?(\d+)$/.exec(key);
    if (!match) continue;

    const [, field, indexText] = match;
    const index = Number(indexText);
    const current = cardsMap.get(index) || {};

    if (field === "Icon") {
      current.icon = String(value || "").trim() || "⭐";
    }
    if (field === "Title") {
      current.title = String(value || "").trim();
    }
    if (field === "Description") {
      current.description = String(value || "").trim();
    }

    cardsMap.set(index, current);
  }

  const serviceCards = Array.from(cardsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, card]) => ({
      icon: card.icon || "⭐",
      title: card.title || "",
      description: card.description || "",
    }))
    .filter((card) => card.title && card.description);

  await dbConnect();
  if (serviceCards.length > 0) {
    await SiteConfig.findOneAndUpdate(
      { key: SERVICE_CARDS_KEY },
      { value: JSON.stringify(serviceCards) },
      { upsert: true }
    );
  } else {
    await SiteConfig.findOneAndDelete({ key: SERVICE_CARDS_KEY });
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateHeaderBanner(formData: FormData) {
  await saveHeaderBanner(formData);
  redirect("/admin?success=banner_updated");
}

export async function updateServiceCards(formData: FormData) {
  await saveServiceCards(formData);
  redirect("/admin?success=services_updated");
}
