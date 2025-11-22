#!/bin/bash
# Helper script to switch between providers

CONFIG_FILE="$HOME/.zulu-pilotrc"

echo "Zulu Pilot - Provider Switcher"
echo "================================"
echo ""
echo "Current configuration:"
cat "$CONFIG_FILE" 2>/dev/null | jq '.' || echo "No config file found"
echo ""
echo "Available providers:"
echo "1. Ollama (Local - requires installation)"
echo "2. Gemini (API Key required)"
echo "3. Google Cloud (gcloud auth required)"
echo "4. OpenAI (API Key required)"
echo ""
read -p "Choose provider (1-4): " choice

case $choice in
  1)
    echo "Setting up Ollama..."
    if ! command -v ollama &> /dev/null; then
      echo "Ollama is not installed."
      echo "Install from: https://ollama.ai"
      echo "Or run: curl -fsSL https://ollama.ai/install.sh | sh"
      exit 1
    fi
    
    # Check if Ollama is running
    if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
      echo "Starting Ollama..."
      ollama serve &
      sleep 2
    fi
    
    # Update config
    jq '.provider = "ollama" | .model = "qwen2.5-coder" | .providers.ollama = {"baseUrl": "http://localhost:11434", "model": "qwen2.5-coder"}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    echo "✅ Switched to Ollama"
    ;;
  2)
    read -p "Enter Gemini API Key: " api_key
    jq --arg key "$api_key" '.provider = "gemini" | .model = "gemini-2.5-pro" | .providers.gemini = {"apiKey": $key, "model": "gemini-2.5-pro"}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    echo "✅ Switched to Gemini"
    ;;
  3)
    echo "Using Google Cloud (gcloud auth print-access-token)"
    read -p "Enter Project ID: " project_id
    read -p "Enter Region (default: us-west2): " region
    region=${region:-us-west2}
    jq --arg pid "$project_id" --arg reg "$region" '.provider = "googleCloud" | .model = "deepseek-ai/deepseek-v3.1-maas" | .providers.googleCloud = {"projectId": $pid, "region": $reg, "model": "deepseek-ai/deepseek-v3.1-maas"}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    echo "✅ Switched to Google Cloud"
    ;;
  4)
    read -p "Enter OpenAI API Key: " api_key
    jq --arg key "$api_key" '.provider = "openai" | .model = "gpt-4" | .providers.openai = {"apiKey": $key, "model": "gpt-4"}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    echo "✅ Switched to OpenAI"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "Updated configuration:"
cat "$CONFIG_FILE" | jq '.'

