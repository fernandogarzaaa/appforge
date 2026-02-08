
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FileSystemTool } from './tools/filesystem.js';
import { GitTool } from './tools/git.js';
import { Base44Tool } from './tools/base44.js';

// Initialize Tools
const fs = new FileSystemTool();
const git = new GitTool();
// Note: Base44Tool might need Env loading if not already done in process
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const base44 = new Base44Tool();

// Create MCP Server
const server = new McpServer({
    name: "AppForge Swarm",
    version: "1.0.0"
});

// Register Tools
server.tool(
    "read_file",
    { path: z.string() },
    async ({ path }) => {
        try {
            const content = await fs.readFile(path);
            return { content: [{ type: "text", text: content }] };
        } catch (err: any) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
        }
    }
);

server.tool(
    "write_file",
    { path: z.string(), content: z.string() },
    async ({ path, content }) => {
        try {
            await fs.writeFile(path, content);
            return { content: [{ type: "text", text: `Successfully wrote to ${path}` }] };
        } catch (err: any) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
        }
    }
);

server.tool(
    "git_commit",
    { message: z.string() },
    async ({ message }) => {
        try {
            await git.commit(message);
            return { content: [{ type: "text", text: `Committed with message: "${message}"` }] };
        } catch (err: any) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
        }
    }
);

server.tool(
    "log_activity",
    { agent: z.string(), message: z.string() },
    async ({ agent, message }) => {
        try {
            await base44.logActivity(agent, message);
            return { content: [{ type: "text", text: `Logged activity for ${agent}` }] };
        } catch (err: any) {
            return { content: [{ type: "text", text: `Error (Offline Mode?): ${err.message}` }], isError: true };
        }
    }
);

// Start Server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("AppForge Swarm MCP Server running on Stdio...");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
