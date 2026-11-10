import "server-only";

import { fromZodError } from "./action-result";
import { mutationResult } from "./mutation-result";
import { unwrap } from "./query-result";
import { INVALID_RECORD, isRecordId } from "./record-id";
import { nameRecordSchema, nameRecordUpdateSchema } from "./name-record";
import { verifySession } from "./session";
import { createClient } from "./supabase/server";

type NameRecordTable = "categories" | "banks";

export const listNameRecords = async (table: NameRecordTable) => {
  await verifySession();
  const supabase = await createClient();
  return unwrap(await supabase.from(table).select("id, name").order("name"));
};

export const createNameRecord = async (table: NameRecordTable, formData: FormData) => {
  const parsed = nameRecordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from(table).insert(parsed.data);
  return mutationResult(error);
};

export const updateNameRecord = async (table: NameRecordTable, formData: FormData) => {
  const parsed = nameRecordUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ name: parsed.data.name }).eq("id", parsed.data.id);
  return mutationResult(error);
};

export const deleteNameRecord = async (table: NameRecordTable, id: string) => {
  if (!isRecordId(id)) return INVALID_RECORD;

  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  return mutationResult(error);
};
