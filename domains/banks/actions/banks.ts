"use server";

import type { ActionResult } from "@/shared/helpers/action-result";
import { createNameRecord, deleteNameRecord, updateNameRecord } from "@/shared/helpers/name-record-actions";

export const createBankAction = async (_state: ActionResult | null, formData: FormData) =>
  createNameRecord("banks", formData);

export const updateBankAction = async (_state: ActionResult | null, formData: FormData) =>
  updateNameRecord("banks", formData);

export const deleteBankAction = async (id: string) => deleteNameRecord("banks", id);
