"use server";

import type { ActionResult } from "@/shared/helpers/action-result";
import { createNameRecord, deleteNameRecord, updateNameRecord } from "@/shared/helpers/name-record-actions";

export const createCategoryAction = async (_state: ActionResult | null, formData: FormData) =>
  createNameRecord("categories", formData);

export const updateCategoryAction = async (_state: ActionResult | null, formData: FormData) =>
  updateNameRecord("categories", formData);

export const deleteCategoryAction = async (id: string) => deleteNameRecord("categories", id);
