import { AnyDataModel } from "convex/server";

// Mock types to allow build before codegen
export type Id<T extends string> = string & { __tableName: T };
export type Doc<T extends string> = any;
