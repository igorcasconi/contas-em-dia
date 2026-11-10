import "server-only";

import { hasAnyPayment, sumPaid } from "@/domains/payments/services/build-payable-rows";
import { getMonthPayables } from "@/domains/payments/services/payables";
import { getCurrentSalary } from "@/domains/salary/services/salary";

import { computeLeftover } from "./compute-leftover";

export const getMonthSummary = async () => {
  const [salaryCents, rows] = await Promise.all([getCurrentSalary(), getMonthPayables()]);
  const paidCents = sumPaid(rows);

  return {
    salaryCents,
    leftoverCents: computeLeftover(salaryCents, paidCents),
    hasPayments: hasAnyPayment(rows),
  };
};
