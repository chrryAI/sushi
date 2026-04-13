# Vex TypeScript Configuration

This package provides shared TypeScript configurations for the Vex monorepo.

## ✨ Features

- **Shared Configurations**: The package includes a base configuration and specialized configurations for Next.js and React libraries.
- **Strict Type Checking**: The configurations are designed to enforce strict type checking, helping to catch errors early and improve code quality.
- **Easy to Use**: The configurations are easy to use and can be extended to meet the specific needs of each project.

## 🚀 Usage

To use a configuration in your project, extend it in your `tsconfig.json` file.

### Base Configuration

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Next.js Configuration

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### React Library Configuration

```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
