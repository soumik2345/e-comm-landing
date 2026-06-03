import { model, models, Schema, type InferSchemaType } from "mongoose";

const siteConfigSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, unique: true },
    value: { type: String, default: "" },
  },
  { timestamps: true }
);

export type SiteConfigDoc = InferSchemaType<typeof siteConfigSchema> & {
  _id: string;
};

const SiteConfig = models.SiteConfig || model("SiteConfig", siteConfigSchema);

export default SiteConfig;
