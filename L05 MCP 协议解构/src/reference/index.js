import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { tools } from "./tools/index.js";

// 解析命令行参数
const args = process.argv.slice(2);
const enableSSE = args.includes("--sse") || process.env.ENABLE_SSE === "true";

// 创建 MCP 服务器
const server = new McpServer({
  name: enableSSE ? "weather-mcp-server-sse" : "weather-mcp-server",
  version: "1.0.0"
}, enableSSE ? {
  capabilities: {
    logging: {} // SSE 模式启用日志推送能力
  }
} : undefined);

// 存储所有活跃的传输连接（仅 SSE 模式使用）
const transports = new Map();

// 注册所有工具
tools.forEach(tool => {
  if (enableSSE) {
    // SSE 模式：包装 handler 以传递 server、sessionId 和 transport
    server.registerTool(
      tool.name,
      tool.definition,
      async (args, extra) => {
        // 从 extra 中获取 sessionId 和 transport
        let sessionId = extra?.sessionId;
        let transport = null;
        
        // 尝试从 transport 获取 sessionId
        if (extra?.transport) {
          transport = extra.transport;
          sessionId = transport.sessionId || sessionId;
        }
        
        // 如果还没有 transport，尝试通过 sessionId 查找
        if (!transport && sessionId) {
          transport = transports.get(sessionId);
        }
        
        // 如果还是没有，尝试从所有活跃的 transport 中查找（用于调试）
        if (!transport) {
          console.warn(`[工具调用] 无法找到 transport，当前活跃连接:`, Array.from(transports.keys()));
          // 如果有活跃连接，使用第一个（仅用于调试）
          if (transports.size > 0) {
            const firstSessionId = Array.from(transports.keys())[0];
            transport = transports.get(firstSessionId);
            sessionId = firstSessionId;
            console.warn(`[工具调用] 使用第一个活跃连接: ${firstSessionId}`);
          }
        }
        
        console.log(`[工具调用] ${tool.name}, sessionId: ${sessionId}, hasTransport: ${!!transport}, transportType: ${transport?.constructor?.name}`);
        
        return await tool.handler(args, {
          ...extra,
          server: server,
          sessionId: sessionId,
          transport: transport
        });
      }
    );
  } else {
    // JSON 响应模式：直接使用原始 handler
    server.registerTool(
      tool.name,
      tool.definition,
      tool.handler
    );
  }
});

const METHOD_NOT_ALLOWED_RESPONSE = {
  jsonrpc: "2.0",
  error: {
    code: -32000,
    message: "Method not allowed. This server only supports POST requests."
  },
  id: null
};

// 定期推送服务器状态更新（仅 SSE 模式）
let statusUpdateInterval = null;

async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : (enableSSE ? 3001 : 3000);
  const host = process.env.HOST || "0.0.0.0";

  const app = express();
  app.use(express.json());

  // 添加 CORS 支持
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, MCP-Session-Id');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  if (enableSSE) {
    // ==================== SSE 模式 ====================
    
    // GET 端点：建立 SSE 连接
    app.get("/mcp", async (req, res) => {
      console.log("=== SSE 连接请求 (GET) ===");
      console.log("请求方法:", req.method);
      console.log("请求路径:", req.path);
      console.log("请求头:", JSON.stringify(req.headers, null, 2));
      console.log("====================");

      const sessionId = req.headers['mcp-session-id'];
      
      // GET 请求必须提供 session ID（session 应该先通过 POST 初始化创建）
      if (!sessionId) {
        console.log("[SSE] GET 请求缺少 session ID");
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: sessionId is required. Please initialize the session first with a POST request."
          },
          id: null
        });
      }

      const transport = transports.get(sessionId);
      if (!transport) {
        console.log(`[SSE] 找不到 session ${sessionId} 对应的 transport`);
        return res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Not Found: No active session found for this sessionId. Please reinitialize."
          },
          id: null
        });
      }

      try {
        console.log(`[SSE] 为 session ${sessionId} 建立 SSE 流`);
        
        // 处理 GET 请求，建立 SSE 连接
        // handleRequest 会自动发送 session 事件，包含 session ID
        await transport.handleRequest(req, res);
        
        // SSE 流建立后，延迟推送欢迎消息（确保流已建立）
        setTimeout(async () => {
          try {
            await server.sendLoggingMessage({
              level: 'info',
              data: `🎉 SSE 连接已建立！会话 ID: ${sessionId}`
            }, sessionId);
            
            await server.sendLoggingMessage({
              level: 'info',
              data: `📋 当前可用工具: ${tools.map(t => t.name).join(', ')}`
            }, sessionId);

            await server.sendLoggingMessage({
              level: 'info',
              data: `💡 提示：服务器可以主动推送消息！尝试调用 getWeatherSSE 工具查看效果。`
            }, sessionId);
          } catch (error) {
            console.error('推送欢迎消息失败:', error);
          }
        }, 1000); // 延迟确保 SSE 流完全建立
      } catch (error) {
        console.error("建立 SSE 连接时出错:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error"
            },
            id: null
          });
        }
      }
    });

    // POST 端点：接收消息并通过 SSE 推送响应
    app.post("/mcp", async (req, res) => {
      console.log("=== MCP 消息请求 (POST) ===");
      console.log("请求方法:", req.method);
      console.log("请求路径:", req.path);
      console.log("请求头:", JSON.stringify(req.headers, null, 2));
      console.log("请求体:", JSON.stringify(req.body, null, 2));
      console.log("====================");

      const sessionId = req.headers['mcp-session-id'];
      const isInitRequest = isInitializeRequest(req.body);
      
      // 检查是否是初始化请求
      // 注意：即使有 session ID，如果是初始化请求，也应该创建新 session
      if (isInitRequest) {
        // 如果 session 已存在，先清理旧的
        if (sessionId && transports.has(sessionId)) {
          console.log(`[SSE] 初始化请求但 session ${sessionId} 已存在，清理旧 session`);
          const oldTransport = transports.get(sessionId);
          try {
            await oldTransport.close();
          } catch (e) {
            // 忽略关闭错误
          }
          transports.delete(sessionId);
        }
        
        console.log("[SSE] 收到初始化请求，创建新 session");
        // 创建新的 transport
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: false, // SSE 模式
          onsessioninitialized: (sid) => {
            console.log(`[SSE] 会话已初始化: ${sid}`);
            transports.set(sid, transport);
          }
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports.has(sid)) {
            console.log(`[SSE] Transport 已关闭: ${sid}`);
            transports.delete(sid);
          }
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // 非初始化请求，必须有有效的 session
      if (!sessionId) {
        console.log("[SSE] POST 请求缺少 session ID");
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: sessionId is required. Please initialize the session first."
          },
          id: req.body?.id || null
        });
      }

      const transport = transports.get(sessionId);
      if (!transport) {
        console.log(`[SSE] 找不到 session ${sessionId} 对应的 transport`);
        return res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Not Found: No active session found for this sessionId. Please reinitialize."
          },
          id: req.body?.id || null
        });
      }

      try {
        // 设置 server 的 transport 为当前 transport
        // 这样 server.sendLoggingMessage() 可以找到正确的 transport
        // 注意：对于同一个 session，transport 应该保持一致，所以不需要恢复
        const originalTransport = server._transport;
        const originalOnMessage = transport.onmessage;
        
        // 如果当前 transport 和 server._transport 不同，更新它
        // 这允许同一个 server 处理多个 session
        if (originalTransport !== transport) {
          server._transport = transport;
        }
        
        // 包装 onmessage 以确保 extra 中包含 transport 和 sessionId
        transport.onmessage = (message, extra) => {
          const enhancedExtra = {
            ...extra,
            transport: transport,
            sessionId: sessionId
          };
          if (originalOnMessage) {
            return originalOnMessage(message, enhancedExtra);
          }
        };
        
        try {
          // handleRequest 会处理请求并调用工具 handler
          // 工具 handler 可能是异步的，所以 transport 需要保持设置
          await transport.handleRequest(req, res, req.body);
          
          // 注意：不在这里恢复 server._transport
          // 因为：
          // 1. 工具 handler 可能是异步的，在 handleRequest 返回后继续执行
          // 2. 对于同一个 session，transport 应该保持一致
          // 3. 如果切换到不同的 session，会在下一个请求时更新 server._transport
        } finally {
          // 只恢复 onmessage，不恢复 transport
          // transport 会在下一个请求时根据 session 更新
          transport.onmessage = originalOnMessage;
        }
      } catch (error) {
        console.error("处理 MCP 消息时出错:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error"
            },
            id: null
          });
        }
      }
    });

    // DELETE 端点：终止会话
    app.delete("/mcp", async (req, res) => {
      const sessionId = req.headers['mcp-session-id'];
      if (!sessionId) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: sessionId is required"
          },
          id: null
        });
      }

      const transport = transports.get(sessionId);
      if (transport) {
        await transport.close();
        transports.delete(sessionId);
        res.status(200).json({
          jsonrpc: "2.0",
          result: {},
          id: null
        });
      } else {
        res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Not Found: No active session found"
          },
          id: null
        });
      }
    });

    // 健康检查端点
    app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        transport: "sse",
        activeSessions: transports.size,
        timestamp: new Date().toISOString()
      });
    });

    // 启动定期状态更新推送（每30秒推送一次服务器状态）
    statusUpdateInterval = setInterval(async () => {
      if (transports.size === 0) return;

      const statusMessage = {
        level: 'info',
        data: `📊 服务器状态更新 - 活跃连接数: ${transports.size}, 时间: ${new Date().toLocaleTimeString('zh-CN')}`
      };

      // 向所有活跃连接推送状态更新
      for (const [sessionId, transport] of transports.entries()) {
        try {
          await server.sendLoggingMessage(statusMessage, sessionId);
        } catch (error) {
          // 如果推送失败，可能是连接已关闭，清理该连接
          console.error(`推送状态更新到会话 ${sessionId} 失败:`, error);
        }
      }
    }, 30000); // 每30秒推送一次

  } else {
    // ==================== JSON 响应模式 ====================
    
    // POST 端点
    app.post("/mcp", async (req, res) => {
      // 记录客户端请求内容
      console.log("=== MCP 客户端请求 ===");
      console.log("请求方法:", req.method);
      console.log("请求路径:", req.path);
      console.log("请求头:", JSON.stringify(req.headers, null, 2));
      console.log("请求体:", JSON.stringify(req.body, null, 2));
      console.log("====================");

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true // JSON 响应模式
      });

      res.on("close", () => transport.close());

      // 拦截响应以记录响应内容
      const chunks = [];
      let responseLogged = false;
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);
      const originalJson = res.json.bind(res);

      // 拦截 write 方法收集数据块
      res.write = function(chunk, encoding, callback) {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        }
        return originalWrite(chunk, encoding, callback);
      };

      // 拦截 json 方法
      res.json = function(body) {
        if (!responseLogged) {
          responseLogged = true;
          console.log("=== MCP 服务器响应 ===");
          console.log("响应状态码:", res.statusCode);
          console.log("响应体:", JSON.stringify(body, null, 2));
          console.log("====================");
        }
        return originalJson(body);
      };

      // 拦截 end 方法
      res.end = function(chunk, encoding, callback) {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        }

        // 如果还没有记录响应（res.json 没有被调用），则记录收集到的数据
        if (!responseLogged && chunks.length > 0) {
          responseLogged = true;
          const responseData = Buffer.concat(chunks).toString('utf8');
          try {
            const responseBody = JSON.parse(responseData);
            console.log("=== MCP 服务器响应 ===");
            console.log("响应状态码:", res.statusCode);
            console.log("响应体:", JSON.stringify(responseBody, null, 2));
            console.log("====================");
          } catch (e) {
            // 如果不是 JSON，记录原始内容
            console.log("=== MCP 服务器响应 ===");
            console.log("响应状态码:", res.statusCode);
            console.log("响应体 (原始):", responseData);
            console.log("====================");
          }
        }

        return originalEnd(chunk, encoding, callback);
      };

      try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error("处理 MCP 请求时出错:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error"
            },
            id: null
          });
        }
      }
    });

    app.get("/mcp", (req, res) => {
      res.status(405).set("Allow", "POST").json(METHOD_NOT_ALLOWED_RESPONSE);
    });

    app.delete("/mcp", (req, res) => {
      res.status(405).set("Allow", "POST").json(METHOD_NOT_ALLOWED_RESPONSE);
    });
  }

  app.listen(port, host, () => {
    console.log(`MCP Weather Server${enableSSE ? ' (SSE 模式)' : ''} 已启动`);
    console.log(`监听地址: http://${host}:${port}/mcp`);
    console.log(`支持的工具: ${tools.map(t => t.name).join(", ")}`);
    
    if (enableSSE) {
      console.log(`\nSSE 特性:`);
      console.log(`  ✓ 服务器主动推送欢迎消息`);
      console.log(`  ✓ 工具执行过程中的实时进度推送`);
      console.log(`  ✓ 定期服务器状态更新（每30秒）`);
      console.log(`  ✓ 支持长时间运行的异步通知流`);
      console.log(`\n支持的端点:`);
      console.log(`  - GET    /mcp     - 建立 SSE 连接`);
      console.log(`  - POST   /mcp     - 发送消息（响应通过 SSE 推送）`);
      console.log(`  - DELETE /mcp     - 终止会话`);
      console.log(`  - GET    /health  - 健康检查`);
      console.log(`\nSSE 连接 URL: http://${host}:${port}/mcp`);
    } else {
      console.log(`\n模式: HTTP JSON 响应模式`);
      console.log(`端点: POST /mcp`);
    }
  });
}

// 优雅关闭
process.on("SIGINT", async () => {
  console.log("\n正在关闭服务器...");
  
  // 停止状态更新推送
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
  }

  // 向所有连接推送关闭通知（仅 SSE 模式）
  if (enableSSE && transports.size > 0) {
    for (const [sessionId, transport] of transports.entries()) {
      try {
        await server.sendLoggingMessage({
          level: 'info',
          data: '服务器正在关闭，连接即将断开...'
        }, sessionId);
      } catch (error) {
        // 忽略推送失败
      }
    }

    // 等待一下让消息发送完成
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 关闭所有活跃的传输连接
    for (const [sessionId, transport] of transports.entries()) {
      try {
        console.log(`关闭会话: ${sessionId}`);
        await transport.close();
      } catch (error) {
        console.error(`关闭会话 ${sessionId} 时出错:`, error);
      }
    }
    
    transports.clear();
  }
  
  console.log("服务器已关闭");
  process.exit(0);
});

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
