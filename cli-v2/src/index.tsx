#!/usr/bin/env node
/**
 * SUSHI CLI v2 Entry Point
 * 🍣 Spatial AI Development Assistant
 */

import React from "react";
import { render } from "ink";
import { App } from "./components/App.js";

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Render the app
render(<App />);
