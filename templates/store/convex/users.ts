import { MutationCtx, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { requireUser } from "./authz";

/** Usuário da loja correspondente ao login Clerk atual (ou null). */
export async function currentUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

/** Igual a currentUser, mas cria o registro no primeiro uso. */
export async function getOrCreateUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await requireUser(ctx);
  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (existing) return existing;
  const id = await ctx.db.insert("users", { name: identity.name ?? "Cliente", clerkId: identity.subject });
  return (await ctx.db.get(id))!;
}
