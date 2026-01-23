import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools } from "./tools/index.js";

// 创建 MCP 服务器
const server = new McpServer({
  name: "weather-mcp-server-stdio",
  version: "1.0.0"
}, {
  capabilities: {
    logging: {} // 启用日志推送能力
  }
});

// 注册所有工具
tools.forEach(tool => {
  server.registerTool(
    tool.name,
    tool.definition,
    // 包装 handler 以传递 server 和 sessionId
    async (args, extra) => {
      const sessionId = extra?.sessionId;
      
      console.error(`[工具调用] ${tool.name}, sessionId: ${sessionId || 'N/A'}`);
      
      return await tool.handler(args, {
        ...extra,
        server: server,
        sessionId: sessionId
      });
    }
  );
});

async function main() {
  // 创建 stdio 传输
  // 默认使用 process.stdin 和 process.stdout
  const transport = new StdioServerTransport();

  // 设置错误处理
  transport.onerror = (error) => {
    console.error("[传输错误]", error);
  };

  transport.onclose = () => {
    console.error("[传输关闭]");
    process.exit(0);
  };

  try {
    // 连接服务器到传输
    // 注意：server.connect() 会自动调用 transport.start()
    await server.connect(transport);
    
    console.error("MCP Weather Server (stdio 模式) 已启动");
    console.error("支持的工具:", tools.map(t => t.name).join(", "));
    console.error("通过标准输入输出进行通信");
    console.error("等待客户端连接...");
    
    // stdio 传输会持续运行，直到进程退出
    // 不需要额外的服务器监听代码
  } catch (error) {
    console.error("服务器启动失败:", error);
    process.exit(1);
  }
}

// 处理进程信号
process.on("SIGINT", async () => {
  console.error("\n正在关闭服务器...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("\n正在关闭服务器...");
  process.exit(0);
});

// 启动服务器
main().catch((error) => {
  console.error("程序执行失败:", error);
  process.exit(1);
});
