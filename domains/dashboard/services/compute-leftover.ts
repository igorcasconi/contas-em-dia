/** Sobra = salário do mês − total pago no mês. Pendentes não descontam; pode ser negativa. */
export const computeLeftover = (salaryCents: number, paidCents: number) => salaryCents - paidCents;
