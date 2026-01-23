import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  console.log("🚀 启动 MCP stdio 客户端测试\n");

  // 创建 stdio 传输
  // StdioClientTransport 会自动启动服务器进程
  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/reference/index-stdio.js"]
  });

  // 监听服务器的 stderr 输出（用于调试）
  if (transport.stderr) {
    transport.stderr.on('data', (data) => {
      // 服务器的 stderr 输出（日志信息）
      process.stderr.write(data);
    });
  }

  // 监听传输层的消息
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
      
      console.log(`${emoji} [${level?.toUpperCase()}] ${data}`);
    }
  };

  // 创建 MCP 客户端
  const client = new Client(
    {
      name: "test-stdio-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {}
      },
    }
  );

  // 监听客户端层的通知
  client.onnotification = (notification) => {
    if (notification.method === "notifications/message") {
      const { level, data } = notification.params || {};
      const emoji = {
        info: "ℹ️",
        warning: "⚠️",
        error: "❌",
        debug: "🔍",
      }[level] || "📢";
      
      console.log(`${emoji} [${level?.toUpperCase()}] [客户端层] ${data}`);
    }
  };

  try {
    // 连接到服务器
    console.log("🔌 正在连接 stdio 服务器...");
    await client.connect(transport);
    console.log("✅ stdio 连接已建立\n");

    // 等待一下，让服务器初始化
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 列出可用工具
    console.log("📋 获取可用工具列表...");
    const toolsList = await client.listTools();
    console.log(`✅ 找到 ${toolsList.tools.length} 个工具:`);
    toolsList.tools.forEach((tool) => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // 测试 getWeather 工具
    console.log("🌤️  测试 getWeather 工具（成都）...");
    console.log("=".repeat(60));
    
    const result1 = await client.callTool({
      name: "getWeather",
      arguments: {
        city: "成都",
      },
    });

    console.log("\n📊 工具返回的响应:");
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

    // 等待接收推送消息
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n" + "=".repeat(60));
    console.log("🌤️  测试 getWeather 工具（北京）...");
    console.log("=".repeat(60));

    const result2 = await client.callTool({
      name: "getWeather",
      arguments: {
        city: "北京",
      },
    });

    console.log("\n📊 工具返回的响应:");
    if (result2.content) {
      result2.content.forEach((item) => {
        if (item.type === "text") {
          console.log(item.text);
        }
      });
    }

    // 再等待接收推送消息
    await new Promise((resolve) => setTimeout(resolve, 2000));

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
