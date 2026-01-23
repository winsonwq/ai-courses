/**
 * OAuth 2.0 直接测试脚本
 * 不需要 SSE，直接测试 OAuth 流程
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const SERVER_URL = "http://localhost:3000";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testOAuth() {
  console.log("=".repeat(60));
  console.log("🧪 OAuth 2.0 直接测试");
  console.log("=".repeat(60));
  console.log();

  const client = new Client({
    name: "oauth-direct-test",
    version: "1.0.0"
  });

  try {
    console.log("1️⃣ 连接 MCP Server...");
    const transport = new StreamableHTTPClientTransport(new URL(`${SERVER_URL}/sse`));
    await client.connect(transport);
    console.log("   ✅ 连接成功\n");

    console.log("2️⃣ 获取工具列表...");
    const tools = await client.listTools();
    console.log(`   工具数量: ${tools.tools.length}`);
    tools.tools.forEach(t => console.log(`   - ${t.name}: ${t.description}`));
    console.log();

    console.log("3️⃣ 调用 login 工具获取认证 URL...");
    const loginResult = await client.callTool({ name: "login", arguments: {} });
    console.log("   返回结果:", JSON.stringify(loginResult, null, 2));
    console.log();

    // 提取登录 URL
    const text = loginResult.content?.[0]?.text || "";
    const urlMatch = text.match(/http:\/\/localhost:3000\/auth\/callback\?code=[^\s\n]+/);
    
    if (!urlMatch) {
      console.log("❌ 无法提取登录 URL");
      return;
    }

    const authUrl = urlMatch[0];
    console.log("4️⃣ 提取到登录 URL:");
    console.log(`   ${authUrl}\n`);

    console.log("5️⃣ 模拟浏览器访问登录 URL（触发 OAuth 回调）...");
    const response = await fetch(authUrl);
    console.log(`   HTTP 状态: ${response.status}`);
    console.log("   页面标题:", response.headers.get("content-type")?.includes("html") ? "Login Success Page" : "Unknown");
    console.log();

    console.log("6️⃣ 等待 Server 处理回调...");
    await sleep(1000);

    console.log("7️⃣ 检查认证状态...");
    const statusResult = await client.callTool({ name: "get_auth_status", arguments: {} });
    console.log("   状态:", statusResult.content?.[0]?.text);
    console.log();

    console.log("8️⃣ 尝试保存笔记...");
    const saveResult = await client.callTool({
      name: "save_note",
      arguments: { name: "test-oauth-note", content: "This note was saved after OAuth authentication!" }
    });
    console.log("   保存结果:", JSON.stringify(saveResult, null, 2));
    console.log();

    console.log("9️⃣ 读取刚才保存的笔记...");
    const readResult = await client.callTool({
      name: "read_note",
      arguments: { name: "test-oauth-note" }
    });
    console.log("   读取结果:", JSON.stringify(readResult, null, 2));
    console.log();

    console.log("✅ OAuth 测试完成！");

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await client.close();
  }
}

testOAuth();
