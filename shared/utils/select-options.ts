export type NamedRecord = { id: string; name: string };

/** Registros `{ id, name }` → opções do `SelectField`. */
export const toSelectOptions = (records: NamedRecord[]) => records.map(({ id, name }) => ({ value: id, label: name }));
