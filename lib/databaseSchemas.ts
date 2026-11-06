/**
 * @file Reference database schemas per project type and engine.
 * Extracted from ResultScreen (pure data → testable, and the component shrank by ~280 lines).
 */
import type { ProjectType } from '../types';

export type DatabaseEngine = 'prisma' | 'sql' | 'supabase' | 'mongodb';

export const DATABASE_ENGINES: { id: DatabaseEngine; label: string }[] = [
  { id: 'prisma', label: 'Prisma' },
  { id: 'sql', label: 'SQL' },
  { id: 'supabase', label: 'Supabase RLS' },
  { id: 'mongodb', label: 'MongoDB' },
];

export function getDatabaseSchema(projectType: ProjectType, dbType: DatabaseEngine): string {
    if (projectType === 'store') {
      if (dbType === 'prisma') {
        return `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  name      String
  cart      Cart?
  reviews   Review[]
  sales     Sale[]
  createdAt DateTime @default(now())
}

model Product {
  id          String   @id @default(cuid())
  name        String
  price       Float
  description String
  category    String
  stock       Int
  imageUrl    String
  reviews     Review[]
  saleItems   SaleItem[]
  createdAt   DateTime @default(now())
}

model Review {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userName  String
  rating    Int
  comment   String
  createdAt DateTime @default(now())
}

model Cart {
  id     String     @id @default(cuid())
  userId String     @unique
  user   User       @relation(fields: [userId], references: [id])
  items  CartItem[]
}

model CartItem {
  id        String @id @default(cuid())
  cartId    String
  cart      Cart   @relation(fields: [cartId], references: [id])
  productId String
  quantity  Int
}

model Sale {
  id              String     @id @default(cuid())
  userId          String
  user            User       @relation(fields: [userId], references: [id])
  total           Float
  items           SaleItem[]
  shippingAddress String
  createdAt       DateTime   @default(now())
}

model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  sale      Sale    @relation(fields: [saleId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  name      String
  price     Float
  quantity  Int
}`;
      } else if (dbType === 'sql') {
        return `-- migrations/001_create_store_schema.sql
CREATE TABLE "users" (
    "id" VARCHAR(255) PRIMARY KEY,
    "clerk_id" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "products" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "stock" INT NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "reviews" (
    "id" VARCHAR(255) PRIMARY KEY,
    "product_id" VARCHAR(255) REFERENCES "products"("id") ON DELETE CASCADE,
    "user_id" VARCHAR(255) REFERENCES "users"("id") ON DELETE CASCADE,
    "user_name" VARCHAR(255) NOT NULL,
    "rating" INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "cart" (
    "id" VARCHAR(255) PRIMARY KEY,
    "user_id" VARCHAR(255) UNIQUE REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "cart_items" (
    "id" VARCHAR(255) PRIMARY KEY,
    "cart_id" VARCHAR(255) REFERENCES "cart"("id") ON DELETE CASCADE,
    "product_id" VARCHAR(255) REFERENCES "products"("id"),
    "quantity" INT NOT NULL CHECK (quantity > 0)
);

CREATE TABLE "sales" (
    "id" VARCHAR(255) PRIMARY KEY,
    "user_id" VARCHAR(255) REFERENCES "users"("id"),
    "total" DECIMAL(10, 2) NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
      } else if (dbType === 'supabase') {
        return `-- Supabase RLS Policies for Store
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produtos públicos para leitura" ON products
  FOR SELECT TO public USING (true);

CREATE POLICY "Apenas admin manipula produtos" ON products
  FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Adições de reviews autenticados" ON reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Leitura de reviews pública" ON reviews
  FOR SELECT TO public USING (true);`;
      } else {
        return `// models/Product.js - MongoDB Schema
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  imageUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);`;
      }
    } else if (projectType === 'blog') {
      if (dbType === 'prisma') {
        return `// prisma/schema.prisma
model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  summary     String
  content     String    @db.Text
  published   Boolean   @default(false)
  likesCount  Int       @default(0)
  comments    Comment[]
  createdAt   DateTime  @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    String
  text      String
  persona   String   @default("Fanboy")
  createdAt DateTime @default(now())
}`;
      } else if (dbType === 'sql') {
        return `-- migrations/001_create_blog_schema.sql
CREATE TABLE "posts" (
    "id" VARCHAR(255) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "published" BOOLEAN DEFAULT false,
    "likes_count" INT DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "comments" (
    "id" VARCHAR(255) PRIMARY KEY,
    "post_id" VARCHAR(255) REFERENCES "posts"("id") ON DELETE CASCADE,
    "author" VARCHAR(255) NOT NULL,
    "text" TEXT NOT NULL,
    "persona" VARCHAR(50) DEFAULT 'Fanboy',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
      } else if (dbType === 'supabase') {
        return `-- Supabase RLS Policies for Blog
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts públicos" ON posts FOR SELECT TO public USING (true);
CREATE POLICY "Leitura de comentários pública" ON comments FOR SELECT TO public USING (true);`;
      } else {
        return `// models/Post.js - MongoDB Schema
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);`;
      }
    } else {
      if (dbType === 'prisma') {
        return `// prisma/schema.prisma
model Trip {
  id          String      @id @default(cuid())
  userId      String
  destination String
  itineraries Itinerary[]
  createdAt   DateTime    @default(now())
}

model Itinerary {
  id          String   @id @default(cuid())
  tripId      String
  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  dayTitle    String
  transport   String
  morningPlan String
  afterPlan   String
  eveningPlan String
}`;
      } else if (dbType === 'sql') {
        return `-- migrations/001_create_travel_schema.sql
CREATE TABLE "trips" (
    "id" VARCHAR(255) PRIMARY KEY,
    "user_id" VARCHAR(255) NOT NULL,
    "destination" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "itineraries" (
    "id" VARCHAR(255) PRIMARY KEY,
    "trip_id" VARCHAR(255) REFERENCES "trips"("id") ON DELETE CASCADE,
    "day_title" VARCHAR(255) NOT NULL,
    "transport" VARCHAR(255),
    "morning" TEXT,
    "afternoon" TEXT,
    "evening" TEXT
);`;
      } else {
        return `// models/Trip.js - MongoDB Schema
const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  destination: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.models.Trip || mongoose.model('Trip', TripSchema);`;
      }
    }
}
