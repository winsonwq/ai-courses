/**
 * MCP 协议类型定义
 * 基于 Model Context Protocol 2024-11-05 版本
 */

/**
 * JSON-RPC 2.0 基础类型
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: unknown
  id: number | string | null
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  result?: unknown
  error?: JsonRpcError
  id: number | string | null
}

export interface JsonRpcError {
  code: number
  message: string
  data?: unknown
}

export interface JsonRpcNotification {
  jsonrpc: '2.0'
  method: string
  params?: unknown
}

/**
 * MCP 协议版本
 */
export const MCP_PROTOCOL_VERSION = '2024-11-05'

/**
 * Initialize 请求参数
 */
export interface InitializeParams {
  protocolVersion: string
  capabilities: ClientCapabilities
  clientInfo: ClientInfo
}

export interface ClientCapabilities {
  roots?: {
    listChanged?: boolean
  }
  sampling?: unknown
}

export interface ClientInfo {
  name: string
  version: string
}

/**
 * Initialize 响应结果
 */
export interface InitializeResult {
  protocolVersion: string
  capabilities: ServerCapabilities
  serverInfo: ServerInfo
}

export interface ServerCapabilities {
  tools?: {
    listChanged?: boolean
  }
  resources?: {
    subscribe?: boolean
    listChanged?: boolean
  }
  prompts?: {
    listChanged?: boolean
  }
  logging?: unknown
}

export interface ServerInfo {
  name: string
  version: string
}

/**
 * Tools/List 响应
 */
export interface ToolsListResult {
  tools: Tool[]
}

export interface Tool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties?: Record<string, unknown>
    required?: string[]
  }
}

/**
 * Tools/Call 请求参数
 */
export interface ToolsCallParams {
  name: string
  arguments?: Record<string, unknown>
}

/**
 * Tools/Call 响应结果
 */
export interface ToolsCallResult {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError?: boolean
}

/**
 * 工具函数：创建 JSON-RPC 请求
 */
export function createRequest(
  method: string,
  params: unknown,
  id: number | string,
): JsonRpcRequest {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id,
  }
}

/**
 * 工具函数：创建 JSON-RPC 通知（无 ID）
 */
export function createNotification(
  method: string,
  params?: unknown,
): JsonRpcNotification {
  return {
    jsonrpc: '2.0',
    method,
    params,
  }
}

/**
 * 工具函数：创建 JSON-RPC 响应
 */
export function createResponse(
  id: number | string | null,
  result?: unknown,
  error?: JsonRpcError,
): JsonRpcResponse {
  const response: JsonRpcResponse = {
    jsonrpc: '2.0',
    id,
  }

  if (error) {
    response.error = error
  } else {
    response.result = result
  }

  return response
}
