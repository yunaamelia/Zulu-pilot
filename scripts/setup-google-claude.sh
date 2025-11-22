#!/bin/bash
# Setup Google Claude as primary provider with all models

CONFIG_FILE="$HOME/.zulu-pilotrc"
PROJECT_ID="protean-tooling-476420-i8"

echo "Setting up Google Claude as primary provider..."
echo ""

# Read existing config or create new
if [ -f "$CONFIG_FILE" ]; then
    echo "Reading existing configuration..."
    CONFIG=$(cat "$CONFIG_FILE")
else
    echo "Creating new configuration..."
    CONFIG="{}"
fi

# Update config with googleClaude as primary
echo "Updating configuration..."

# Use jq to update config
UPDATED_CONFIG=$(echo "$CONFIG" | jq --arg projectId "$PROJECT_ID" '
  .provider = "googleClaude" |
  .model = "deepseek-ai/deepseek-v3.1-maas" |
  .providers.googleClaude = {
    projectId: $projectId,
    region: "us-west2",
    model: "deepseek-ai/deepseek-v3.1-maas"
  } |
  .providers.googleCloud = {
    projectId: $projectId,
    region: "us-west2",
    model: "deepseek-ai/deepseek-v3.1-maas"
  }
')

# Backup existing config
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backup created: ${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Write updated config
echo "$UPDATED_CONFIG" | jq '.' > "$CONFIG_FILE"

echo ""
echo "✅ Configuration updated!"
echo ""
echo "Primary Provider: googleClaude"
echo "Default Model: deepseek-ai/deepseek-v3.1-maas"
echo ""
echo "All registered models in googleClaude:"
echo "  - deepseek-ai/deepseek-v3.1-maas"
echo "  - qwen/qwen3-coder-480b-a35b-instruct-maas"
echo "  - deepseek-ai/deepseek-r1-0528-maas"
echo "  - moonshotai/kimi-k2-thinking-maas"
echo "  - openai/gpt-oss-120b-maas"
echo "  - meta/llama-3.1-405b-instruct-maas"
echo "  - gemini-2.5-pro"
echo "  - gemini-1.5-pro"
echo "  - gemini-1.5-flash"
echo ""
echo "Configuration file: $CONFIG_FILE"
echo ""
echo "To verify, run: node dist/src/cli/index.js model --list"

