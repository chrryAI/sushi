# Vex Database Package

This package contains the database schema, migrations, and seeding scripts for the Vex platform. It uses Drizzle ORM to provide a type-safe database layer.

## ✨ Features

- **Drizzle ORM**: The database layer is built on top of Drizzle ORM, providing a type-safe and intuitive API for interacting with the database.
- **PostgreSQL**: The package is designed to work with PostgreSQL, a powerful open-source relational database.
- **Migrations**: The package includes a migration system for managing changes to the database schema over time.
- **Seeding**: The package includes a seeding system for populating the database with initial data.

## 🚀 Getting Started

### Prerequisites

- PostgreSQL 14+

### Setup Instructions

1.  **Set up environment variables**:

    Copy the `.env.example` file to `.env` and fill in your database connection details:

    ```bash
    cp .env.example .env
    ```

2.  **Generate the Drizzle schema**:

    ```bash
    pnpm run generate
    ```

3.  **Run migrations**:

    ```bash
    pnpm run migrate
    ```

4.  **Seed the database**:

    ```bash
    pnpm run seed
    ```

## 🛠️ Development

To generate a new migration, run the following command:

```bash
pnpm run g
```

To push changes directly to the database without creating a migration, run:

```bash
pnpm run push
```

To open the Drizzle Studio, run:

```bash
pnpm run studio
```

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
