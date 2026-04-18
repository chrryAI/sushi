import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["index.ts", "locales.ts"],
  format: ["cjs", "esm"],
  // dts: { entryOnly: true },
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react-native",
    "next",
    "next/navigation",
    "next/router",
    "next-auth",
    "i18n-iso-countries",
    "crypto",
    "uuid",
    "swr",
    "motion",
    "react-big-calendar",
    "@capacitor-firebase/authentication",
    "firebase",
  ],
  // Don't bundle CSS/SCSS - let consumers handle it
  loader: {
    ".scss": "empty", // Don't copy SCSS files, they'll be imported from source
    ".css": "copy", // Copy regular CSS files
  },
})
