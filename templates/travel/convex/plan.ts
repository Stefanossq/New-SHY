import { MutationCtx } from "./_generated/server";

/**
 * Regras do plano do usuário. Sem o módulo de pagamentos não há limites.
 * Com pagamentos, o New SHY substitui este arquivo pela versão com plano grátis/Premium.
 */
export async function assertCanSaveTrip(_ctx: MutationCtx, _clerkId: string): Promise<void> {}
