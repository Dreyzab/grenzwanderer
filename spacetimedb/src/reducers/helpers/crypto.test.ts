import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { sha256Hex } from "./crypto";

const referenceSha256Hex = (input: string): string =>
  createHash("sha256").update(input, "utf8").digest("hex");

const generateCorpus = (): string[] => {
  const fixed = [
    "",
    "abc",
    "hello world",
    "The quick brown fox jumps over the lazy dog",
    "The quick brown fox jumps over the lazy dog.",
    "Freiburg im Breisgau",
    "Grusse, Etienne",
    "Gruesse, Etienne",
    "Gr\u00fc\u00dfe, \u00c9tienne",
    "Freiburg \u2192 Karlsruhe",
    "dice \u{1f3b2} map \u{1f5fa}\ufe0f",
    "line one\nline two\r\nline three",
    "0".repeat(55),
    "0".repeat(56),
    "0".repeat(57),
    "0".repeat(63),
    "0".repeat(64),
    "0".repeat(65),
    "0".repeat(127),
    "0".repeat(128),
    "0".repeat(129),
  ];
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,;:_-/\\|[]{}()!?";
  let state = 0x9e3779b9;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };

  const generated = Array.from({ length: 96 }, () => {
    const length = next() % 256;
    let value = "";
    for (let index = 0; index < length; index += 1) {
      value += alphabet[next() % alphabet.length];
    }
    return value;
  });

  return [...fixed, ...generated];
};

describe("sha256Hex", () => {
  it("matches published SHA-256 vectors", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha256Hex("The quick brown fox jumps over the lazy dog")).toBe(
      "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    );
    expect(sha256Hex("The quick brown fox jumps over the lazy dog.")).toBe(
      "ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c",
    );
  });

  it("matches Node crypto for deterministic property-style samples", () => {
    for (const input of generateCorpus()) {
      expect(sha256Hex(input)).toBe(referenceSha256Hex(input));
    }
  });
});
