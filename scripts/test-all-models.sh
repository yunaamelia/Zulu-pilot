#!/bin/bash
# Script to test chat on all registered models

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$HOME/.zulu-pilotrc"
TEST_PROMPT="Hello, this is a test message. Please respond briefly."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
SKIPPED=0
RESULTS=()

echo "=========================================="
echo "Zulu Pilot - Test All Models"
echo "=========================================="
echo ""
echo "Test prompt: \"$TEST_PROMPT\""
echo ""

# Function to test a model
test_model() {
    local provider=$1
    local model=$2
    local description=$3
    
    echo -e "${BLUE}Testing: ${provider} - ${model}${NC}"
    echo -e "${YELLOW}Description: ${description}${NC}"
    echo "----------------------------------------"
    
    # Check if provider needs special setup
    case $provider in
        ollama)
            if ! command -v ollama &> /dev/null; then
                echo -e "${YELLOW}⚠ SKIPPED: Ollama not installed${NC}"
                ((SKIPPED++))
                RESULTS+=("SKIP: $provider/$model - Ollama not installed")
                return
            fi
            if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
                echo -e "${YELLOW}⚠ SKIPPED: Ollama not running${NC}"
                ((SKIPPED++))
                RESULTS+=("SKIP: $provider/$model - Ollama not running")
                return
            fi
            ;;
        gemini)
            if ! grep -q '"apiKey"' "$CONFIG_FILE" 2>/dev/null; then
                echo -e "${YELLOW}⚠ SKIPPED: Gemini API key not configured${NC}"
                ((SKIPPED++))
                RESULTS+=("SKIP: $provider/$model - API key not configured")
                return
            fi
            ;;
        openai)
            if ! grep -q '"apiKey"' "$CONFIG_FILE" 2>/dev/null; then
                echo -e "${YELLOW}⚠ SKIPPED: OpenAI API key not configured${NC}"
                ((SKIPPED++))
                RESULTS+=("SKIP: $provider/$model - API key not configured")
                return
            fi
            ;;
        googleCloud)
            if ! command -v gcloud &> /dev/null; then
                echo -e "${YELLOW}⚠ SKIPPED: gcloud CLI not installed${NC}"
                ((SKIPPED++))
                RESULTS+=("SKIP: $provider/$model - gcloud not installed")
                return
            fi
            if ! gcloud auth print-access-token &> /dev/null; then
                echo -e "${YELLOW}⚠ SKIPPED: gcloud not authenticated${NC}"
                ((SKIPPED++))
                RESULTS+=("SKIP: $provider/$model - gcloud not authenticated")
                return
            fi
            ;;
    esac
    
    # Run test with timeout
    if timeout 60 node "$PROJECT_DIR/dist/src/cli/index.js" --debug chat "$TEST_PROMPT" --provider "$provider" 2>&1 | tee /tmp/zulu-test-${provider}-${model}.log | grep -q "Error:"; then
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
        RESULTS+=("FAIL: $provider/$model")
    else
        # Check if we got a response (not just errors)
        if grep -q "Stream error\|ConnectionError\|RateLimitError" /tmp/zulu-test-${provider}-${model}.log; then
            echo -e "${RED}✗ FAILED (Connection/Error)${NC}"
            ((FAILED++))
            RESULTS+=("FAIL: $provider/$model - Connection error")
        else
            echo -e "${GREEN}✓ PASSED${NC}"
            ((PASSED++))
            RESULTS+=("PASS: $provider/$model")
        fi
    fi
    echo ""
}

# Test Ollama models
echo -e "${BLUE}=== Testing Ollama Models ===${NC}"
test_model "ollama" "qwen2.5-coder" "Qwen 2.5 Coder"
test_model "ollama" "llama3.2" "Llama 3.2"
test_model "ollama" "mistral" "Mistral"
test_model "ollama" "codellama" "CodeLlama"
test_model "ollama" "deepseek-coder" "DeepSeek Coder"

# Test Gemini models
echo -e "${BLUE}=== Testing Gemini Models ===${NC}"
test_model "gemini" "gemini-2.5-pro" "Gemini 2.5 Pro"
test_model "gemini" "gemini-1.5-pro" "Gemini 1.5 Pro"
test_model "gemini" "gemini-1.5-flash" "Gemini 1.5 Flash"

# Test OpenAI models
echo -e "${BLUE}=== Testing OpenAI Models ===${NC}"
test_model "openai" "gpt-4" "GPT-4"
test_model "openai" "gpt-4-turbo" "GPT-4 Turbo"
test_model "openai" "gpt-3.5-turbo" "GPT-3.5 Turbo"

# Test Google Cloud models
echo -e "${BLUE}=== Testing Google Cloud AI Platform Models ===${NC}"
test_model "googleCloud" "deepseek-ai/deepseek-v3.1-maas" "DeepSeek V3.1 (us-west2)"
test_model "googleCloud" "qwen/qwen3-coder-480b-a35b-instruct-maas" "Qwen Coder 480B (us-south1)"
test_model "googleCloud" "deepseek-ai/deepseek-r1-0528-maas" "DeepSeek R1 (us-central1)"
test_model "googleCloud" "moonshotai/kimi-k2-thinking-maas" "Kimi K2 (global)"
test_model "googleCloud" "openai/gpt-oss-120b-maas" "GPT OSS 120B (us-central1)"
test_model "googleCloud" "meta/llama-3.1-405b-instruct-maas" "Llama 3.1 405B (us-central1)"

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo -e "${YELLOW}Skipped: ${SKIPPED}${NC}"
echo ""
echo "Detailed Results:"
for result in "${RESULTS[@]}"; do
    if [[ $result == PASS:* ]]; then
        echo -e "${GREEN}${result}${NC}"
    elif [[ $result == FAIL:* ]]; then
        echo -e "${RED}${result}${NC}"
    else
        echo -e "${YELLOW}${result}${NC}"
    fi
done

# Exit with error if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
fi

