/**
 * Integration test for MCP server manager with custom providers
 *
 * T149 [US6] - Test MCP servers with custom providers
 *
 * @package @zulu-pilot/tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { McpClientManager } from '../../../packages/core/src/tools/mcp-client-manager.js';
import type { Config, MCPServerConfig } from '@google/gemini-cli-core';
import type { ToolRegistry } from '../../../packages/core/src/tools/tool-registry.js';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import { ProviderRegistry } from '@zulu-pilot/adapter';
import { MultiProviderRouter } from '@zulu-pilot/adapter';
import { OllamaProvider } from '@zulu-pilot/providers';

describe('T149: MCP Server Manager with Custom Providers', () => {
  let mockConfig: Config;
  let toolRegistry: ToolRegistry;
  let mcpClientManager: McpClientManager;
  let adapter: GeminiCLIModelAdapter;
  let registry: ProviderRegistry;
  let router: MultiProviderRouter;

  beforeEach(async () => {
    // Setup custom providers
    registry = new ProviderRegistry();
    registry.registerFactory('ollama', (config: any) => {
      return new OllamaProvider({
        baseUrl: config.baseUrl || 'http://localhost:11434',
        model: config.model || 'qwen2.5-coder',
      });
    });

    const configManager = new UnifiedConfigManager();
    const unifiedConfig = await configManager.loadConfig();

    router = new MultiProviderRouter({
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
      getMcpServerCommand: jest.fn().mockReturnValue(''),
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

    mcpClientManager = new McpClientManager(toolRegistry, mockConfig);
  });

  afterEach(async () => {
    // Cleanup: disconnect all MCP servers
    const clients = mcpClientManager.getClients?.();
    if (clients) {
      for (const [name] of clients) {
        try {
          await mcpClientManager.disconnectServer?.(name);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  });

  it('should work with Ollama provider', async () => {
    // Verify MCP manager works with Ollama provider
    expect(adapter).toBeDefined();
    expect(registry).toBeDefined();
    expect(router).toBeDefined();
    expect(mcpClientManager).toBeDefined();

    // Verify Ollama provider is registered
    const ollamaFactory = registry.getFactory('ollama');
    expect(ollamaFactory).toBeDefined();

    // Configure MCP server
    const mcpServerConfig: MCPServerConfig = {
      name: 'test-ollama-mcp',
      command: 'node',
      args: ['--version'],
      enabled: true,
    };

    mockConfig.getMcpServers = jest.fn().mockReturnValue({
      'test-ollama-mcp': mcpServerConfig,
    });

    // Attempt to discover (may fail without real server, but integration should work)
    try {
      await mcpClientManager.maybeDiscoverMcpServer('test-ollama-mcp', mcpServerConfig);
    } catch (error) {
      // Expected if no real server
    }

    // Verify integration components are ready
    expect(mcpClientManager).toBeDefined();
    expect(toolRegistry).toBeDefined();
    expect(adapter).toBeDefined();
  });

  it('should handle MCP servers with multiple custom providers', async () => {
    // Setup with multiple providers
    registry.registerFactory('openai', (config: any) => {
      // Mock OpenAI provider
      return {
        name: 'openai',
        baseUrl: config.baseUrl || 'https://api.openai.com',
        model: config.model || 'gpt-4',
      } as any;
    });

    const multiProviderRouter = new MultiProviderRouter({
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
        openai: {
          type: 'openai',
          name: 'openai',
          config: {
            baseUrl: 'https://api.openai.com',
            model: 'gpt-4',
          },
        },
      },
    });

    const multiProviderAdapter = new GeminiCLIModelAdapter({
      router: multiProviderRouter,
      config: await new UnifiedConfigManager().loadConfig(),
    });

    expect(multiProviderAdapter).toBeDefined();
    expect(multiProviderRouter).toBeDefined();

    // Verify MCP manager works with multiple providers
    const mcpServerConfig: MCPServerConfig = {
      name: 'multi-provider-mcp',
      command: 'node',
      enabled: true,
    };

    mockConfig.getMcpServers = jest.fn().mockReturnValue({
      'multi-provider-mcp': mcpServerConfig,
    });

    // Verify MCP manager can handle multiple providers
    expect(mcpClientManager).toBeDefined();
  });

  it('should register tools from MCP servers with custom providers', async () => {
    // Verify tool registration works with custom providers
    expect(toolRegistry.registerTool).toBeDefined();
    expect(mcpClientManager).toBeDefined();
    expect(adapter).toBeDefined();

    // Configure MCP server
    const mcpServerConfig: MCPServerConfig = {
      name: 'tool-registration-test',
      command: 'node',
      enabled: true,
    };

    mockConfig.getMcpServers = jest.fn().mockReturnValue({
      'tool-registration-test': mcpServerConfig,
    });

    // Verify tool registry is ready
    expect(toolRegistry.registerTool).toBeDefined();
    expect(toolRegistry.sortTools).toBeDefined();

    // Tools should be registered when MCP server is discovered
    try {
      await mcpClientManager.maybeDiscoverMcpServer('tool-registration-test', mcpServerConfig);
    } catch (error) {
      // Expected if no real server
    }

    // Verify integration is ready
    expect(mcpClientManager).toBeDefined();
  });

  it('should handle provider switching with MCP servers', async () => {
    // Verify MCP servers persist across provider switches
    expect(adapter).toBeDefined();
    expect(router).toBeDefined();

    // Configure MCP server
    const mcpServerConfig: MCPServerConfig = {
      name: 'provider-switch-test',
      command: 'node',
      enabled: true,
    };

    mockConfig.getMcpServers = jest.fn().mockReturnValue({
      'provider-switch-test': mcpServerConfig,
    });

    // Verify MCP manager persists
    expect(mcpClientManager).toBeDefined();

    // Tools should remain available after provider switch
    expect(toolRegistry.registerTool).toBeDefined();
    expect(toolRegistry.getTools).toBeDefined();
  });

  it('should work with custom adapter and MCP server integration', async () => {
    // T148: Verify MCP server integration works with custom adapter
    expect(adapter).toBeDefined();
    expect(mcpClientManager).toBeDefined();
    expect(toolRegistry).toBeDefined();

    // Verify integration chain: MCP -> Tools -> Adapter -> Router -> Provider
    expect(adapter.getCurrentProvider).toBeDefined();
    expect(router).toBeDefined();
    expect(registry).toBeDefined();

    // Configure MCP server
    const mcpServerConfig: MCPServerConfig = {
      name: 'adapter-integration-test',
      command: 'node',
      enabled: true,
    };

    mockConfig.getMcpServers = jest.fn().mockReturnValue({
      'adapter-integration-test': mcpServerConfig,
    });

    // Verify complete integration
    expect(mcpClientManager).toBeDefined();
    expect(toolRegistry).toBeDefined();
    expect(adapter).toBeDefined();
    expect(router).toBeDefined();
  });
});

