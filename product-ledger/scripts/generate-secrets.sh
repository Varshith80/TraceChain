#!/bin/bash

# Generate production secrets
# This script generates secure random secrets for production deployment

set -e

SECRETS_DIR="./secrets"

# Create secrets directory if it doesn't exist
mkdir -p "$SECRETS_DIR"

echo "Generating production secrets..."

# Generate PostgreSQL user (default)
if [ ! -f "$SECRETS_DIR/postgres_user.txt" ]; then
    echo "productledger" > "$SECRETS_DIR/postgres_user.txt"
    echo "✅ Generated postgres_user.txt"
else
    echo "⚠️  postgres_user.txt already exists, skipping"
fi

# Generate PostgreSQL password
if [ ! -f "$SECRETS_DIR/postgres_password.txt" ]; then
    openssl rand -base64 32 > "$SECRETS_DIR/postgres_password.txt"
    echo "✅ Generated postgres_password.txt"
else
    echo "⚠️  postgres_password.txt already exists, skipping"
fi

# Generate JWT secret
if [ ! -f "$SECRETS_DIR/jwt_secret.txt" ]; then
    openssl rand -base64 64 > "$SECRETS_DIR/jwt_secret.txt"
    echo "✅ Generated jwt_secret.txt"
else
    echo "⚠️  jwt_secret.txt already exists, skipping"
fi

# Generate CouchDB password
if [ ! -f "$SECRETS_DIR/couchdb_password.txt" ]; then
    openssl rand -base64 32 > "$SECRETS_DIR/couchdb_password.txt"
    echo "✅ Generated couchdb_password.txt"
else
    echo "⚠️  couchdb_password.txt already exists, skipping"
fi

# Set restrictive permissions
chmod 600 "$SECRETS_DIR"/*.txt 2>/dev/null || true

echo ""
echo "✅ Secrets generated successfully!"
echo "⚠️  IMPORTANT: Add secrets/ to .gitignore if not already added"
echo "⚠️  Store these secrets securely - they will not be shown again"

