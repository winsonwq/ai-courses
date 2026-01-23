import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001/mcp";

async function main() {
  console.log("🚀 启动 MCP SSE 客户端测试");
  console.log(`📡 连接服务器: ${SERVER_URL}\n`);

  // 创建 Streamable HTTP 传输（支持 SSE）
  const transport = new StreamableHTTPClientTransport(new URL(SERVER_URL));

  // 监听传输层的原始消息（用于接收 SSE 推送的通知）
  transport.onmessage = (message) => {
    // 处理通知消息
    if (message.method === 'notifications/message') {
      const { level, data } = message.params || {};
      const emoji = {
        info: "ℹ️",
        warning: "⚠️",
        error: "❌",
        debug: "🔍",
      }[level] || "📢";
      
      // 由 transport.onmessage 打印（传输层）
      console.log(`${emoji} [${level?.toUpperCase()}] ${data}`);
    }
  };

  // 创建 MCP 客户端
  const client = new Client(
    {
      name: "test-sse-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        // 启用日志通知能力
        experimental: {},
      },
    }
  );

  // 监听客户端层的通知（作为备用，主要使用 transport.onmessage）
  // 注意：实际消息主要由 transport.onmessage 处理，这里通常不会触发
  client.onnotification = (notification) => {
    if (notification.method === "notifications/message") {
      const { level, data } = notification.params || {};
      const emoji = {
        info: "ℹ️",
        warning: "⚠️",
        error: "❌",
        debug: "🔍",
      }[level] || "📢";
      
      // 由 client.onnotification 打印（客户端层，通常不会触发）
      console.log(`${emoji} [${level?.toUpperCase()}] [客户端层] ${data}`);
    }
  };

  try {
    // 连接到服务器（Client.connect() 会自动调用 transport.start()）
    console.log("🔌 正在连接 SSE 服务器...");
    await client.connect(transport);
    console.log("✅ SSE 连接已建立\n");

    // 等待一下，让服务器发送欢迎消息
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 列出可用工具
    console.log("📋 获取可用工具列表...");
    const toolsList = await client.listTools();
    console.log(`✅ 找到 ${toolsList.tools.length} 个工具:`);
    toolsList.tools.forEach((tool) => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // 测试 getWeatherSSE 工具
    console.log("🌤️  测试 getWeatherSSE 工具（成都）...");
    console.log("=" .repeat(60));
    
    const result1 = await client.callTool({
      name: "getWeatherSSE",
      arguments: {
        city: "成都",
      },
    });

    console.log(result1);
    console.log("\n📊 工具返回的初始响应:");
    if (result1.content) {
      result1.content.forEach((item) => {
        if (item.type === "text") {
          console.log(item.text);
        }
      });
    }
    if (result1.isError) {
      console.log("❌ 工具执行出错");
    }

    // 等待接收 SSE 推送的消息（getWeatherSSE 会分多次推送）
    console.log("\n⏳ 等待接收 SSE 推送的实时消息...");
    console.log("=" .repeat(60));
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 等待 10 秒接收推送

    console.log("\n" + "=".repeat(60));
    console.log("🌤️  测试 getWeatherSSE 工具（北京）...");
    console.log("=" .repeat(60));

    const result2 = await client.callTool({
      name: "getWeatherSSE",
      arguments: {
        city: "北京",
      },
    });
    console.log(result2);

    console.log("\n📊 工具返回的初始响应:");
    if (result2.content) {
      result2.content.forEach((item) => {
        if (item.type === "text") {
          console.log(item.text);
        }
      });
    }

    // 再等待接收推送消息
    console.log("\n⏳ 等待接收 SSE 推送的实时消息...");
    console.log("=" .repeat(60));
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("\n✅ 测试完成！");

  } catch (error) {
    console.error("❌ 错误:", error);
    if (error.stack) {
      console.error("堆栈:", error.stack);
    }
  } finally {
    // 关闭连接
    console.log("\n🔌 正在关闭连接...");
    await client.close();
    await transport.close();
    console.log("👋 连接已关闭");
  }
}

main().catch((error) => {
  console.error("程序执行失败:", error);
  process.exit(1);
});
