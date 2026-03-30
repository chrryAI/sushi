// Math utilities for mutation testing demonstration

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}

function max(a, b) {
  return a > b ? a : b;
}

function min(a, b) {
  return a < b ? a : b;
}

export { add, subtract, multiply, divide, max, min };
