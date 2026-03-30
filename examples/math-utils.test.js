// Tests for math-utils.js

import { add, subtract, multiply, divide, max, min } from "./math-utils.js";

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`);
    process.exit(1);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toThrow(fn) {
      try {
        fn();
        throw new Error("Expected function to throw");
      } catch (err) {
        // Expected
      }
    },
  };
}

// Run tests
console.log("Running math-utils tests...\n");

test("add adds two numbers", () => {
  expect(add(2, 3)).toBe(5);
  expect(add(-1, 1)).toBe(0);
});

test("subtract subtracts two numbers", () => {
  expect(subtract(5, 3)).toBe(2);
  expect(subtract(0, 5)).toBe(-5);
});

test("multiply multiplies two numbers", () => {
  expect(multiply(3, 4)).toBe(12);
  expect(multiply(-2, 3)).toBe(-6);
});

test("divide divides two numbers", () => {
  expect(divide(12, 4)).toBe(3);
  expect(divide(10, 2)).toBe(5);
});

test("divide throws on zero", () => {
  try {
    divide(10, 0);
    throw new Error("Should have thrown");
  } catch (err) {
    if (!err.message.includes("Cannot divide by zero")) {
      throw new Error("Wrong error message: " + err.message);
    }
  }
});

test("max returns the larger number", () => {
  expect(max(5, 3)).toBe(5);
  expect(max(1, 10)).toBe(10);
});

test("min returns the smaller number", () => {
  expect(min(5, 3)).toBe(3);
  expect(min(1, 10)).toBe(1);
});

console.log("\nAll tests passed!");
