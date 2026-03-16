# Generated from package.json scripts
# Default recipe prints available tasks (same as `just --list`).

set shell := ["bash", "-cu"]

# Default target
default: list

# Prints the available recipes and a usage hint.
list:
	@echo "Available tasks (from package.json scripts):"
	@just --list
	@echo "\nRun a package script with: just run <script>"

# Run an npm script (pnpm) from package.json.
# Uses Infisical to load secrets via `.infisical.json`.
# Usage: just run dev
# Default script is `dev`, so `just run` runs `pnpm dev`.
run SCRIPT = "dev":
	infisical run -- pnpm run {{SCRIPT}}

# Convenience wrappers for common scripts
run-dev:
	infisical run -- pnpm dev

build:
	infisical run -- pnpm build

start:
	infisical run -- pnpm start

lint:
	infisical run -- pnpm lint

generate-sitemap:
	infisical run -- pnpm run generate-sitemap
