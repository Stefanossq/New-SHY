import { query, QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

type AnyCtx = QueryCtx | MutationCtx | ActionCtx;

/** IDs de usuário Clerk com acesso de administrador (variável ADMIN_USER_IDS no Convex). */
const adminIds = (): string[] =>
  (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

export async function requireUser(ctx: AnyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Faça login para continuar.");
  return identity;
}

export async function isAdmin(ctx: AnyCtx): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  return identity !== null && adminIds().includes(identity.subject);
}

export async function requireAdmin(ctx: AnyCtx) {
  const identity = await requireUser(ctx);
  if (!adminIds().includes(identity.subject)) {
    throw new Error("Acesso restrito a administradores (configure ADMIN_USER_IDS no Convex).");
  }
  return identity;
}

/** Usado pela interface para mostrar ou esconder o painel admin. */
export const amIAdmin = query({
  args: {},
  handler: async (ctx) => isAdmin(ctx),
});
