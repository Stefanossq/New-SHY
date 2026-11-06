import { Doc, Id } from "../convex/_generated/dataModel";

// Explicitly define Product interface to ensure TS knows about 'price' and other fields
// even if generated types are missing or incomplete during initial build.
export interface Product {
  _id: Id<"products">;
  _creationTime: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  imageUrl: string;
}

export type Review = Doc<"reviews">;

export type CartItem = Product & {
  quantity: number;
};
