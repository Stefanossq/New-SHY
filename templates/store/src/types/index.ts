import { Doc } from "@/convex/_generated/dataModel";

export type Product = Doc<"products">;
export type Review = Doc<"reviews">;
export type Order = Doc<"sales">;

export type CartItem = Product & {
  quantity: number;
};

export const ORDER_STATUS_LABEL: Record<Order["status"], string> = {
  placed: "Pedido recebido (pagamento na entrega)",
  pending_payment: "Aguardando confirmação do pagamento",
  paid: "Pagamento aprovado",
  cancelled: "Cancelado",
};

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
