import { describe, expect, test } from "vitest";
import { formatBRL, moneyField, parseBRL } from "./money";

describe("moneyField", () => {
  test("transforms valid input into cents", () => {
    expect(moneyField.parse("R$ 5.000,00")).toBe(500000);
  });

  test.each(["", "abc", "0", "0,00"])("rejects %j", (input) => {
    expect(moneyField.safeParse(input).error?.issues[0].message).toBe("Informe um valor maior que zero");
  });
});

const normalize = (value: string) => value.replace(/ /g, " ");

describe("formatBRL", () => {
  test.each([
    [0, "R$ 0,00"],
    [12345, "R$ 123,45"],
    [123456789, "R$ 1.234.567,89"],
    [-5000, "-R$ 50,00"],
  ])("%i cents → %s", (cents, expected) => {
    expect(normalize(formatBRL(cents))).toBe(expected);
  });
});

describe("parseBRL", () => {
  test.each([
    ["1.234,56", 123456],
    ["R$ 1.234,56", 123456],
    ["123", 12300],
    ["123,4", 12340],
    ["0,99", 99],
    ["  50,00 ", 5000],
  ])("%s → %i cents", (input, expected) => {
    expect(parseBRL(input)).toBe(expected);
  });

  test.each(["", "abc", "12,345", "-10,00", "1.23.4,00", "R$"])("%s → null", (input) => {
    expect(parseBRL(input)).toBeNull();
  });
});
