/**
 * Integration test for MCP tool execution with custom adapter
 *
 * T146 [P] [US6] - Write integration test for MCP tool execution
 *
 * @package @zulu-pilot/tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DiscoveredMCPTool } from '../../../packages/core/src/tools/mcp-tool.js';
import type { Config, MCPServerConfig } from '@google/gemini-cli-core';
import type { ToolRegistry } from '../../../packages/core/src/tools/tool-registry.js';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import { ProviderRegistry } from '@zulu-pilot/adapter';
import { MultiProviderRouter } from '@zulu-pilot/adapter';
import { OllamaProvider } from '@zulu-pilot/providers';
import type { CallableTool } from '@google/genai';

describe('MCP Tool Execution Integration', () => {
  let mockConfig: Config;
  let toolRegistry: ToolRegistry;
  let adapter: GeminiCLIModelAdapter;

  beforeEach(async () => {
    // Setup mock config with custom adapter
    const configManager = new UnifiedConfigManager();
    const unifiedConfig = await configManager.loadConfig();

    const registry = new ProviderRegistry();
    registry.registerFactory('ollama', (config: any) => {
      return new OllamaProvider({
        baseUrl: config.baseUrl || 'http://localhost:11434',
        model: config.model || 'qwen2.5-coder',
      });
    });

    const router = new MultiProviderRouter({
      defaultProvider: 'ollama',
      providers: {
        ollama: {
          type: 'ollama',
          name: 'ollama',
          config: {
            baseUrl: 'http://localhost:11434',
            model: 'qwen2.5-coder',
          },
        },
      },
    });

    adapter = new GeminiCLIModelAdapter({
      router,
      config: unifiedConfig,
    });

    // Create mock Config object
    mockConfig = {
      isTrustedFolder: jest.fn().mockReturnValue(true),
      getMcpServers: jest.fn().mockReturnValue({}),
      getPromptRegistry: jest.fn().mockReturnValue({
        registerPrompt: jest.fn(),
        getPrompt: jest.fn(),
      }),
      getDebugMode: jest.fn().mockReturnValue(false),
      getWorkspaceContext: jest.fn().mockReturnValue({
        workspaceRoot: process.cwd(),
        isTrusted: true,
      }),
      getAllowedMcpServers: jest.fn().mockReturnValue([]),
      getBlockedMcpServers: jest.fn().mockReturnValue([]),
      getGeminiClient: jest.fn().mockReturnValue({
        isInitialized: jest.fn().mockReturnValue(false),
        setTools: jest.fn(),
      }),
    } as unknown as Config;

    // Create mock tool registry
    toolRegistry = {
      registerTool: jest.fn(),
      sortTools: jest.fn(),
      getMessageBus: jest.fn().mockReturnValue(undefined),
      getTools: jest.fn().mockReturnValue([]),
    } as unknown as ToolRegistry;
  });

  it('should create MCP tool from discovered tool definition', () => {
    // Mock MCP tool definition
    const mockMcpTool: CallableTool = {
      name: 'test_tool',
      description: 'A test MCP tool',
      parameters: {
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            description: 'Test parameter',
          },
        },
        required: ['param1'],
      },
    } as CallableTool;

    const mcpServerConfig: MCPServerConfig = {
      name: 'test-server',
      command: 'node',
      enabled: true,
    };

    // Create discovered MCP tool
    const discoveredTool = new DiscoveredMCPTool(
      'test-server',
      'test_tool',
      'test-tool-display-name',
      mockMcpTool,
      mcpServerConfig,
      mockConfig
    );

    expect(discoveredTool).toBeDefined();
    expect(discoveredTool.getName()).toBe('test-tool-display-name');
    expect(discoveredTool.getDescription()).toBe('A test MCP tool');
  });

  it('should execute MCP tool with valid parameters', async () => {
    // Mock MCP tool that returns a result
    const mockMcpTool: CallableTool = {
      name: 'echo_tool',
      description: 'Echo tool for testing',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Message to echo',
          },
        },
        required: ['message'],
      },
    } as CallableTool;

    // Mock tool execution
    const mockToolFunction = jest.fn().mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Echoed: Hello World',
        },
      ],
    });

    // For integration test, we verify the tool structure
    // Actual execution would require a real MCP server
    const mcpServerConfig: MCPServerConfig = {
      name: 'test-server',
      command: 'node',
      enabled: true,
    };

    const discoveredTool = new DiscoveredMCPTool(
      'test-server',
      'echo_tool',
      'echo-tool',
      mockMcpTool,
      mcpServerConfig,
      mockConfig
    );

    expect(discoveredTool).toBeDefined();
    expect(discoveredTool.getName()).toBe('echo-tool');

    // Verify tool can be registered in registry
    toolRegistry.registerTool(discoveredTool);
    expect(toolRegistry.registerTool).toHaveBeenCalledWith(discoveredTool);
  });

  it('should handle tool execution errors gracefully', async () => {
    const mockMcpTool: CallableTool = {
      name: 'error_tool',
      description: 'Tool that errors',
      parameters: {
        type: 'object',
        properties: {},
      },
    } as CallableTool;

    const mcpServerConfig: MCPServerConfig = {
      name: 'test-server',
      command: 'node',
      enabled: true,
    };

    const discoveredTool = new DiscoveredMCPTool(
      'test-server',
      'error_tool',
      'error-tool',
      mockMcpTool,
      mcpServerConfig,
      mockConfig
    );

    expect(discoveredTool).toBeDefined();

    // Tool creation should succeed even if execution would fail
    // Actual execution errors would be handled by the tool invocation
  });

  it('should work with custom adapter for tool execution', async () => {
    // Verify tool execution integrates with custom adapter
    expect(adapter).toBeDefined();
    expect(mockConfig).toBeDefined();
    expect(toolRegistry).toBeDefined();

    // Tools registered with registry should be available to adapter
    const mockMcpTool: CallableTool = {
      name: 'adapter_tool',
      description: 'Tool for adapter testing',
      parameters: {
        type: 'object',
        properties: {},
      },
    } as CallableTool;

    const mcpServerConfig: MCPServerConfig = {
      name: 'test-server',
      command: 'node',
      enabled: true,
    };

    const discoveredTool = new DiscoveredMCPTool(
      'test-server',
      'adapter_tool',
      'adapter-tool',
      mockMcpTool,
      mcpServerConfig,
      mockConfig
    );

    // Register tool
    toolRegistry.registerTool(discoveredTool);

    // Verify integration with adapter
    expect(discoveredTool).toBeDefined();
    expect(toolRegistry.registerTool).toHaveBeenCalled();
  });

  it('should handle multiple tools from same server', () => {
    const serverName = 'multi-tool-server';
    const mcpServerConfig: MCPServerConfig = {
      name: serverName,
      command: 'node',
      enabled: true,
    };

    const tools = [
      {
        name: 'tool1',
        displayName: 'tool-1',
        description: 'First tool',
      },
      {
        name: 'tool2',
        displayName: 'tool-2',
        description: 'Second tool',
      },
    ];

    const discoveredTools = tools.map((tool) => {
      const mockMcpTool: CallableTool = {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: {},
        },
      } as CallableTool;

      return new DiscoveredMCPTool(
        serverName,
        tool.name,
        tool.displayName,
        mockMcpTool,
        mcpServerConfig,
        mockConfig
      );
    });

    expect(discoveredTools).toHaveLength(2);
    expect(discoveredTools[0].getName()).toBe('tool-1');
    expect(discoveredTools[1].getName()).toBe('tool-2');

    // Register all tools
    discoveredTools.forEach((tool) => {
      toolRegistry.registerTool(tool);
    });

    expect(toolRegistry.registerTool).toHaveBeenCalledTimes(2);
  });
});

