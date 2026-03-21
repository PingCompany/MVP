#!/usr/bin/env bash
set -euo pipefail

# Deploy Graphiti + Neo4j to Fly.io
# Prerequisites: flyctl installed and authenticated (`fly auth login`)
#
# Usage:
#   cd services/knowledge-engine
#   ./deploy.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Step 1: Create Neo4j app"
fly apps create ping-neo4j --org personal 2>/dev/null || echo "App ping-neo4j already exists"

echo "==> Step 2: Create volume for Neo4j data"
fly volumes create neo4j_data --app ping-neo4j --region waw --size 10 2>/dev/null || echo "Volume already exists"

echo "==> Step 3: Set Neo4j secrets"
echo "Setting NEO4J_AUTH..."
fly secrets set NEO4J_AUTH="neo4j/${NEO4J_PASSWORD:?Set NEO4J_PASSWORD env var}" --app ping-neo4j

echo "==> Step 4: Deploy Neo4j"
fly deploy --config "$SCRIPT_DIR/neo4j.fly.toml" --app ping-neo4j

echo "==> Step 5: Wait for Neo4j to be healthy"
sleep 10

echo "==> Step 6: Create Graphiti app"
fly apps create ping-graphiti --org personal 2>/dev/null || echo "App ping-graphiti already exists"

echo "==> Step 7: Set Graphiti secrets"
fly secrets set \
  OPENAI_API_KEY="${OPENAI_API_KEY:?Set OPENAI_API_KEY env var}" \
  NEO4J_PASSWORD="${NEO4J_PASSWORD:?Set NEO4J_PASSWORD env var}" \
  --app ping-graphiti

echo "==> Step 8: Deploy Graphiti"
fly deploy --config "$SCRIPT_DIR/graphiti.fly.toml" --app ping-graphiti

echo ""
echo "Done! Graphiti is available at: https://ping-graphiti.fly.dev"
echo "Neo4j browser at: https://ping-neo4j.fly.dev"
echo ""
echo "Set this in Convex environment variables:"
echo "  GRAPHITI_API_URL=https://ping-graphiti.fly.dev"
