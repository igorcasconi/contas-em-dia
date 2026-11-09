import "server-only";

import { refresh } from "next/cache";

import { type ActionResult, fromZodError, mapDbError } from "./action-result";
import { nameRecordSchema, nameRecordUpdateSchema } from "./name-record";
import { verifySession } from "./session";
import { createClient } from "./supabase/server";

type NameRecordTable = "categories" | "banks";

const toResult = (error: { code?: string; message: string } | null): ActionResult => {
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, data: undefined };
};

export const listNameRecords = async (table: NameRecordTable) => {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase.from(table).select("id, name").order("name");
  return data ?? [];
};

export const createNameRecord = async (table: NameRecordTable, formData: FormData) => {
  const parsed = nameRecordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from(table).insert(parsed.data);
  return toResult(error);
};

export const updateNameRecord = async (table: NameRecordTable, formData: FormData) => {
  const parsed = nameRecordUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ name: parsed.data.name }).eq("id", parsed.data.id);
  return toResult(error);
};

export const deleteNameRecord = async (table: NameRecordTable, id: string) => {
  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  return toResult(error);
};
