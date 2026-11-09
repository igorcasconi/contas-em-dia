import { describe, expect, test } from "vitest";
import { mapDbError } from "./action-result";

describe("mapDbError", () => {
  test("unique violation → duplicated name message", () => {
    expect(mapDbError({ code: "23505", message: "duplicate key" })).toBe("Já existe um registro com esse nome.");
  });

  test("foreign key violation → in use message", () => {
    expect(mapDbError({ code: "23503", message: "violates foreign key" })).toBe(
      "Este registro está em uso e não pode ser excluído.",
    );
  });

  test("raise exception from rpc → its own message", () => {
    expect(mapDbError({ code: "P0001", message: "Este pagamento já foi registrado." })).toBe(
      "Este pagamento já foi registrado.",
    );
  });

  test("unknown error → generic message", () => {
    expect(mapDbError({ code: "XX000", message: "internal" })).toBe("Algo deu errado. Tente novamente.");
  });
});
