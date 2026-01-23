import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { randomUUID } from "node:crypto";

export const server = new McpServer({
  name: "Secure Notes with OAuth",
  version: "1.0.0",
});

let isLoggedIn = false;

export function setAuthStatus(status) {
  isLoggedIn = status;
  console.log(`🔄 Auth status changed to: ${isLoggedIn}`);
}

server.tool(
  "login",
  "Generate an authentication URL to login to the secure notes service.",
  async () => {
    if (isLoggedIn) {
      return {
        content: [
          {
            type: "text",
            text: "✅ You are already logged in! You can use the save_note and read_note tools."
          }
        ]
      };
    }

    const state = randomUUID();
    const loginUrl = `http://localhost:3000/auth/callback?code=mock-code-${state}`;

    return {
      content: [
        {
          type: "text",
          text: `🔐 **Authentication Required**

Please click the link below to authenticate with the Secure Notes service:

## 🔗 [Click to Login](${loginUrl})

After logging in, you will be able to use the \`save_note\` and \`read_note\` tools.

**What will happen:**
1. Click the link above to open the login page in your browser
2. Complete the authentication (simulated)
3. Return to Cursor - the tools will be automatically enabled

---
*Note: This is a demo OAuth flow.*`
        }
      ]
    };
  }
);

server.tool(
  "save_note",
  "Save a note to the secure notes service. Requires authentication.",
  {
    name: { type: "string" },
    content: { type: "string" }
  },
  async ({ name, content }) => {
    if (!isLoggedIn) {
      const state = randomUUID();
      const loginUrl = `http://localhost:3000/auth/callback?code=mock-code-${state}`;

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `🔒 **Authentication Required**

You need to authenticate before saving notes.

## 📋 Options to Authenticate:

### Option 1: Click the link below
[🔗 ${loginUrl}](${loginUrl})

### Option 2: Use the login tool
Run the \`login\` tool to get a fresh authentication URL.`
          }
        ]
      };
    }

    const fileName = `${name.replace(/[^a-zA-Z0-9-_]/g, "_")}.txt`;

    console.log(`💾 Saving note: ${fileName}`);

    return {
      content: [
        {
          type: "text",
          text: `✅ **Note Saved Successfully!**

## 📁 File Details
- **File:** \`${fileName}\`
- **Size:** ${content.length} characters
- **Status:** ✅ Saved by authenticated user

You can now use the \`read_note\` tool to retrieve this note.`
        }
      ]
    };
  }
);

server.tool(
  "read_note",
  "Read a note from the secure notes service. Requires authentication.",
  {
    name: { type: "string" }
  },
  async ({ name }) => {
    if (!isLoggedIn) {
      const state = randomUUID();
      const loginUrl = `http://localhost:3000/auth/callback?code=mock-code-${state}`;

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `🔒 **Authentication Required**

You need to authenticate before reading notes.

## 🔗 [Click to Login](${loginUrl})`
          }
        ]
      };
    }

    const fileName = `${name.replace(/[^a-zA-Z0-9-_]/g, "_")}.txt`;

    console.log(`📖 Reading note: ${fileName}`);

    const mockContent = `This is a sample note content for "${name}".
Created: ${new Date().toISOString()}
Authenticated: Yes`;

    return {
      content: [
        {
          type: "text",
          text: `📄 **Note Content: \`${fileName}\`**

\`\`\`
${mockContent}
\`\`\`

---
*This note was retrieved by an authenticated user.*`
        }
      ]
    };
  }
);

server.tool(
  "list_notes",
  "List all notes in the secure notes service. Requires authentication.",
  async () => {
    if (!isLoggedIn) {
      const state = randomUUID();
      const loginUrl = `http://localhost:3000/auth/callback?code=mock-code-${state}`;

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `🔒 **Authentication Required**

[🔗 Click to Login](${loginUrl})`
          }
        ]
      };
    }

    const mockNotes = [
      { name: "demo-note", content: "This is a demo note" },
      { name: "shopping-list", content: "Milk, Eggs, Bread" },
      { name: "meeting-notes", content: "Project discussion" }
    ];

    const notesList = mockNotes.map(n => `- \`${n.name}.txt\` - ${n.content}`).join('\n');

    return {
      content: [
        {
          type: "text",
          text: `📚 **Your Notes**

${notesList}

---
*Showing 3 sample notes. Use \`read_note\` to view content.*`
        }
      ]
    };
  }
);

server.tool(
  "get_auth_status",
  "Check the current authentication status.",
  async () => {
    return {
      content: [
        {
          type: "text",
          text: isLoggedIn 
            ? "✅ You are currently logged in and can use all tools."
            : "❌ You are not logged in. Use the `login` tool to authenticate."
        }
      ]
    };
  }
);

console.log("🔐 Auth Server initialized with tools:");
console.log("   - login: Generate authentication URL");
console.log("   - save_note: Save a note (requires auth)");
console.log("   - read_note: Read a note (requires auth)");
console.log("   - list_notes: List all notes (requires auth)");
console.log("   - get_auth_status: Check current status");
