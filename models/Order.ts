import { model, models, Schema, type InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    totalPrice: { type: Number, required: true, min: 0 },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true },
    shippingAddress: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    trackingCode: { type: String, default: "", trim: true, index: true },
    // Backward compatibility for older single-product orders
    productName: { type: String, trim: true },
    quantity: { type: Number, min: 1 },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof orderSchema> & {
  _id: string;
};

const Order = models.Order || model("Order", orderSchema);

export default Order;
