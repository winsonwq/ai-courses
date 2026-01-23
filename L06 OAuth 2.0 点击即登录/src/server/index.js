import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { server, setAuthStatus } from "./auth-server.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const sessions = new Map();

app.get("/sse", async (req, res) => {
  console.log("➡️ New SSE Connection");

  const sessionId = randomUUID();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId,
  });

  sessions.set(sessionId, { transport });
  await server.connect(transport);
  await transport.handleRequest(req, res);

  setAuthStatus(false);

  req.on("close", () => {
    console.log("❌ SSE Connection closed");
    sessions.delete(sessionId);
    server.close();
  });
});

// POST /sse 用于发送消息
// 初始化请求可能没有 session ID，让 SDK 自己处理
app.post("/sse", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
      await session.transport.handleRequest(req, res, req.body);
      return;
    }
  }

  // 对于没有 session ID 或找不到 session 的请求，尝试找到任意一个 session
  // 这用于处理初始化请求
  if (sessions.size > 0) {
    const firstSession = sessions.values().next().value;
    await firstSession.transport.handleRequest(req, res, req.body);
  } else {
    res.status(404).json({ error: "No active sessions" });
  }
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    res.status(400).send("Login failed: No code received.");
    return;
  }

  console.log(`🔑 Received Auth Code: ${code}, exchanging for token...`);

  const fakeToken = "access-token-" + code;

  console.log(`🔐 Token received: ${fakeToken}`);

  setAuthStatus(true);

  console.log(`📢 Notifying ${sessions.size} session(s)...`);
  server.sendToolListChanged();

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login Successful</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          margin: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        }
        .card { 
          background: white; 
          padding: 40px; 
          border-radius: 16px; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
          text-align: center; 
          max-width: 400px;
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 20px; }
        .btn { 
          background: #667eea; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 16px;
        }
        .btn:hover { background: #5568d3; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">✅</div>
        <h1>Login Successful!</h1>
        <p>You have successfully authenticated with the Secure Notes service.</p>
        <p style="font-size: 12px; color: #999;">You can close this window and return to Cursor.</p>
        <button class="btn" onclick="window.close()">Close Window</button>
      </div>
      <script>
        setTimeout(() => {
          try { window.close(); } catch(e) {}
        }, 3000);
      </script>
    </body>
    </html>
  `);
});

app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}/sse`);
  console.log(`👉 Callback URL: http://localhost:${PORT}/auth/callback`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
});

console.log("=".repeat(50));
console.log("🔐 OAuth 2.0 Click-to-Login Demo Server");
console.log("=".repeat(50));
