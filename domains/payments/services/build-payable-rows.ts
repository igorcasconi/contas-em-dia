type BillSource = {
  id: string;
  name: string;
  value_mode: string;
  amount_cents: number | null;
  ended_at: string | null;
};

type CardItemSource = {
  id: string;
  name: string;
  bank_id: string;
  amount_cents: number;
  remaining_months: number | null;
  status: string;
};

type PaymentSource = {
  id: string;
  kind: string;
  bill_id: string | null;
  bank_id: string | null;
  total_cents: number;
  items: {
    card_item_id: string;
    included: boolean;
    amount_cents: number;
    prev_remaining_months: number | null;
    prev_status: string;
    card_item: { name: string };
  }[];
};

/** Registros do mês: todos os boletos, itens de cartão abertos, bancos e pagamentos do mês. */
export type PayableSources = {
  bills: BillSource[];
  cardItems: CardItemSource[];
  banks: { id: string; name: string }[];
  payments: PaymentSource[];
};

export type PayableItem = {
  id: string;
  name: string;
  amountCents: number;
  remainingMonths: number | null;
  status: string;
};

export type PayableRow =
  | {
      kind: "bill";
      id: string;
      name: string;
      valueMode: string;
      /** null = variável ainda não pago */
      amountCents: number | null;
      paymentId: string | null;
    }
  | {
      kind: "card";
      id: string;
      name: string;
      amountCents: number;
      paymentId: string | null;
      items: PayableItem[];
    };

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "pt-BR");

/** Não pagos primeiro; maior valor antes; sem valor (variável) por último no grupo; nome desempata. */
const byPriority = (a: PayableRow, b: PayableRow) =>
  Number(!!a.paymentId) - Number(!!b.paymentId) || (b.amountCents ?? -1) - (a.amountCents ?? -1) || byName(a, b);

const toBillRows = ({ bills, payments }: PayableSources): PayableRow[] =>
  bills.flatMap((bill) => {
    const payment = payments.find(({ kind, bill_id }) => kind === "bill" && bill_id === bill.id);
    if (!payment && bill.ended_at) return [];

    return {
      kind: "bill",
      id: bill.id,
      name: bill.name,
      valueMode: bill.value_mode,
      amountCents: payment?.total_cents ?? bill.amount_cents,
      paymentId: payment?.id ?? null,
    };
  });

const toCardRows = ({ banks, cardItems, payments }: PayableSources): PayableRow[] =>
  banks.flatMap((bank) => {
    const payment = payments.find(({ kind, bank_id }) => kind === "card" && bank_id === bank.id);

    if (payment) {
      const items = payment.items
        .filter(({ included }) => included)
        .map((item) => ({
          id: item.card_item_id,
          name: item.card_item.name,
          amountCents: item.amount_cents,
          remainingMonths: item.prev_remaining_months,
          status: item.prev_status,
        }));
      return { kind: "card", id: bank.id, name: bank.name, amountCents: payment.total_cents, paymentId: payment.id, items };
    }

    const openItems = cardItems.filter(({ bank_id }) => bank_id === bank.id).sort(byName);
    if (!openItems.length) return [];

    return {
      kind: "card",
      id: bank.id,
      name: bank.name,
      amountCents: openItems
        .filter(({ status }) => status === "active")
        .reduce((total, { amount_cents }) => total + amount_cents, 0),
      paymentId: null,
      items: openItems.map((item) => ({
        id: item.id,
        name: item.name,
        amountCents: item.amount_cents,
        remainingMonths: item.remaining_months,
        status: item.status,
      })),
    };
  });

export const buildPayableRows = (sources: PayableSources) =>
  [...toBillRows(sources), ...toCardRows(sources)].sort(byPriority);

export const sumPaid = (rows: PayableRow[]) =>
  rows.reduce((total, row) => (row.paymentId ? total + (row.amountCents ?? 0) : total), 0);

/** Algum pagamento registrado no mês (trava a alteração de salário). */
export const hasAnyPayment = (rows: PayableRow[]) => rows.some(({ paymentId }) => paymentId);
