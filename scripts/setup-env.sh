#!/bin/bash

# This script sets up the local environment by copying .env.example files.

echo "Setting up environment files..."

cp packages/db/.env.example packages/db/.env
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
cp apps/ws/.env.example apps/ws/.env

echo "✅ Environment files created. Please fill them with your credentials."
