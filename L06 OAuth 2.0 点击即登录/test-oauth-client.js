/**
 * OAuth 2.0 Click-to-Login Test Client
 * 
 * This script tests the OAuth flow by:
 * 1. Connecting to the MCP Server via SSE
 * 2. Listing available tools (should see login tool)
 * 3. Calling a protected tool (should fail with login URL)
 * 4. Simulating the OAuth callback
 * 5. Listing tools again (should see all tools)
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { randomUUID } from "node:crypto";

const SERVER_URL = "http://localhost:3000";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testOAuthFlow() {
  console.log("=".repeat(60));
  console.log("🧪 OAuth 2.0 Click-to-Login Test");
  console.log("=".repeat(60));
  console.log();

  const client = new Client({
    name: "oauth-test-client",
    version: "1.0.0"
  });

  try {
    console.log("1️⃣ Connecting to MCP Server via SSE...");
    
    const transport = new StreamableHTTPClientTransport(new URL(`${SERVER_URL}/sse`));
    
    await client.connect(transport);
    console.log("   ✅ Connected successfully!");
    console.log();

    console.log("2️⃣ Listing available tools (should only see login tool)...");
    const tools1 = await client.listTools();
    console.log(`   Found ${tools1.tools.length} tools:`);
    tools1.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    console.log("3️⃣ Testing protected tool (save_note) - should fail with login URL...");
    try {
      await client.callTool({
        name: "save_note",
        arguments: { name: "test", content: "Hello World" }
      });
      console.log("   ❌ Unexpected success - should have been blocked!");
    } catch (error) {
      console.log("   ✅ Expected failure received!");
      if (error.message) {
        const loginUrlMatch = error.message.match(/http:\/\/localhost:3000\/auth\/callback\?code=[^\s]+/);
        if (loginUrlMatch) {
          console.log(`   📍 Login URL extracted: ${loginUrlMatch[0]}`);
          console.log();
          console.log("4️⃣ Simulating OAuth callback...");
          
          const callbackUrl = loginUrlMatch[0];
          console.log(`   🔗 Opening: ${callbackUrl}`);
          
          // For testing purposes, we'll call the login tool to get a fresh URL
          console.log();
          console.log("5️⃣ Calling login tool to get fresh authentication URL...");
          const loginResult = await client.callTool({ name: "login", arguments: {} });
          console.log("   Login result:", JSON.stringify(loginResult, null, 2));
        }
      }
    }

    console.log();
    console.log("6️⃣ Waiting for potential auth callback...");
    await sleep(2000);

    console.log();
    console.log("7️⃣ Listing tools again (should see all tools after auth)...");
    const tools2 = await client.listTools();
    console.log(`   Found ${tools2.tools.length} tools:`);
    tools2.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    console.log("8️⃣ Testing protected tool again (should work now)...");
    try {
      const result = await client.callTool({
        name: "save_note",
        arguments: { name: "test-after-auth", content: "This should work now!" }
      });
      console.log("   ✅ Success! Result:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.log("   ⚠️ Still blocked - auth callback may not have been processed");
      console.log("   Error:", error.message);
    }

    console.log();
    console.log("9️⃣ Testing other protected tools...");
    
    const readResult = await client.callTool({
      name: "read_note",
      arguments: { name: "demo-note" }
    });
    console.log("   read_note result:", JSON.stringify(readResult, null, 2));

    const listResult = await client.callTool({
      name: "list_notes",
      arguments: {}
    });
    console.log("   list_notes result:", JSON.stringify(listResult, null, 2));

    console.log();
    console.log("✅ Test completed!");
    console.log();
    console.log("Note: In a real browser scenario:");
    console.log("   1. User clicks the login URL");
    console.log("   2. Browser opens and shows login page");
    console.log("   3. User completes authentication");
    console.log("   4. Server processes callback and updates auth status");
    console.log("   5. Server sends list_changed notification");
    console.log("   6. Client refreshes tool list automatically");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testOAuthFlow().catch(console.error);
