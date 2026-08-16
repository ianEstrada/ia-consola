/**
 * owu-memory — bridge between Open WebUI (local AI) and opencode.
 *
 * The shared memory is Open WebUI itself: tagged chats + Memories.
 * Convention: chats tagged with the configured tag (default: "link") are
 * shared context. Everything else is ignored.
 *
 * Config (env vars, set in opencode.json -> "env"):
 *   OWU_URL        - Open WebUI base URL (default: http://localhost:8080)
 *   OWU_API_KEY    - API key from Open WebUI: Settings -> Account -> API Keys
 *   OWU_MEMORY_TAG - tag that marks shared chats (default: "link")
 */
import { type Plugin, tool } from "@opencode-ai/plugin";

declare const process: { env: Record<string, string | undefined> };

const OWU_URL = (process.env.OWU_URL || "http://localhost:8080").replace(/\/+$/, "");
const OWU_API_KEY = process.env.OWU_API_KEY || "";
const MEMORY_TAG = (process.env.OWU_MEMORY_TAG || "link").toLowerCase();
const MAX_DIGEST_CHARS = 4000;
const MAX_LINKED_CHATS = 5;
const MAX_CHAT_MESSAGES = 20;
const CACHE_TTL_MS = 10 * 60 * 1000;
const DIGEST_MARKER = "## Linked memory (Open WebUI)";

// ---------------------------------------------------------------------------
// Open WebUI API helpers
// ---------------------------------------------------------------------------

async function owu(path: string, init?: RequestInit): Promise<any> {
  if (!OWU_API_KEY) {
    throw new Error(
      "OWU_API_KEY is not configured. See plugin/README.md: Settings -> Account -> API Keys."
    );
  }
  const res = await fetch(`${OWU_URL}${path}`, {
    method: init?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OWU_API_KEY}`,
      ...(init?.headers || {}),
    },
    body: init?.body,
  });
  if (!res.ok) {
    throw new Error(`Open WebUI ${path} -> HTTP ${res.status}`);
  }
  return res.json();
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) =>
        typeof part === "string" ? part : part?.text || part?.content || ""
      )
      .join("\n")
      .trim();
  }
  return String(content ?? "").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n... [truncated]";
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 16).replace("T", " ");
}

/** Chats tagged with the memory tag, most recent first. */
async function listLinkedChats(): Promise<any[]> {
  const chats = await owu("/api/v1/chats/list?page=1&page_size=100");
  if (!Array.isArray(chats)) return [];
  const linked = chats
    .filter((c) => (c.tags || []).map((t: string) => t.toLowerCase()).includes(MEMORY_TAG))
    .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
    .slice(0, MAX_LINKED_CHATS);
  const full = await Promise.all(
    linked.map(async (c) => {
      try {
        return await owu(`/api/v1/chats/${c.id}`);
      } catch {
        return c; // fall back to list metadata (title only)
      }
    })
  );
  return full;
}

/** Open WebUI Memories (always available to the local AI). */
async function listMemories(): Promise<any[]> {
  const mems = await owu("/api/v1/memories/");
  return Array.isArray(mems) ? mems : [];
}

function chatToText(chat: any): string {
  const msgs = (chat.messages || [])
    .filter((m: any) => typeof m.role === "string")
    .slice(-MAX_CHAT_MESSAGES)
    .map((m: any) => `**${m.role}**: ${messageText(m.content)}`)
    .join("\n\n");
  return `### ${chat.title || "(sin titulo)"} (${formatDate(chat.updated_at)})\n${msgs}`;
}

/** Markdown digest: tagged chats + recent memories, capped. */
async function buildDigest(): Promise<string> {
  const [chats, memories] = await Promise.all([listLinkedChats(), listMemories()]);
  const parts: string[] = [];

  if (chats.length > 0) {
    parts.push(`**Chats compartidos (tag: ${MEMORY_TAG})**:`);
    parts.push(chats.map(chatToText).join("\n\n"));
  }
  if (memories.length > 0) {
    const recent = memories
      .slice()
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
      .slice(0, 8)
      .map((m) => `- ${m.content}`)
      .join("\n");
    parts.push(`**Memorias de la IA local**:\n${recent}`);
  }
  if (parts.length === 0) {
    return `No hay memoria compartida: no hay chats con el tag "${MEMORY_TAG}" ni memorias en Open WebUI.`;
  }
  return truncate(parts.join("\n\n"), MAX_DIGEST_CHARS);
}

// ---------------------------------------------------------------------------
// Session-scoped digest cache
// ---------------------------------------------------------------------------

const digestCache = new Map<string, { text: string; at: number }>();
const appendedSessions = new Set<string>();

async function getDigest(sessionID: string | undefined, force = false): Promise<string> {
  const key = sessionID || "global";
  const cached = digestCache.get(key);
  if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.text;
  }
  const text = await buildDigest();
  digestCache.set(key, { text, at: Date.now() });
  return text;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const OWUMemoryPlugin: Plugin = async ({ client }) => {
  return {
    // Warm the digest cache when a session starts, so the first message
    // already carries the shared context.
    event: async ({ event }) => {
      const e = event as { type?: string; sessionID?: string };
      if (e.type === "session.created") {
        try {
          await getDigest(e.sessionID, true);
        } catch (err: any) {
          await client.app.log({
            body: {
              service: "owu-memory",
              level: "error",
              message: `digest warm failed: ${err?.message || err}`,
            },
          });
        }
      }
    },

    // Inject the shared-memory digest into the system prompt, once per session.
    "experimental.chat.system.transform": async (input, output) => {
      const sessionID = (input as { sessionID?: string }).sessionID;
      const key = sessionID || "global";
      try {
        if (appendedSessions.has(key)) return;
        const digest = await getDigest(sessionID);
        const block = `\n\n${DIGEST_MARKER}\n${digest}`;
        const system = (output.system || []) as string[];
        if (system.some((s) => s.includes(DIGEST_MARKER))) {
          appendedSessions.add(key);
          return;
        }
        system.push(block);
        appendedSessions.add(key);
      } catch (err: any) {
        await client.app.log({
          body: {
            service: "owu-memory",
            level: "error",
            message: `system transform failed: ${err?.message || err}`,
          },
        });
      }
    },

    tool: {
      owu_memory_list: tool({
        description:
          "List the shared memory: chats tagged with the memory tag in Open WebUI plus the local AI memories. Use this to see what context is shared between opencode and the local AI.",
        args: {
          limit: tool.schema.number().optional().describe("Max entries to return"),
        },
        async execute(args) {
          const n = Math.max(1, Math.min(args.limit ?? 10, 20));
          const [chats, memories] = await Promise.all([listLinkedChats(), listMemories()]);
          const lines: string[] = [];
          const topChats = chats.slice(0, n);
          if (topChats.length > 0) {
            lines.push(`**Chats compartidos (tag: ${MEMORY_TAG})**:`);
            lines.push(topChats.map(chatToText).join("\n\n"));
          }
          const topMem = memories.slice(0, n);
          if (topMem.length > 0) {
            lines.push(`**Memorias de la IA local**:`);
            lines.push(topMem.map((m) => `- ${m.content}`).join("\n"));
          }
          return lines.length
            ? truncate(lines.join("\n\n"), MAX_DIGEST_CHARS * 2)
            : `No shared memory found. Tag a chat in Open WebUI with "${MEMORY_TAG}" to share it.`;
        },
      }),

      owu_memory_search: tool({
        description:
          "Search the shared memory (tagged chats in Open WebUI + local AI memories) for a query. Returns matching fragments with their source. Use this when you need details from shared context.",
        args: {
          query: tool.schema.string().describe("Text to search for"),
        },
        async execute(args) {
          const q = args.query.trim().toLowerCase();
          if (!q) return "Provide a query to search for.";
          const [chats, memories] = await Promise.all([listLinkedChats(), listMemories()]);
          const hits: string[] = [];
          for (const chat of chats) {
            const text = chatToText(chat);
            const title = chat.title || "(sin titulo)";
            if (title.toLowerCase().includes(q)) {
              hits.push(`### Chat: ${title}\n${truncate(text, 1500)}`);
              continue;
            }
            const lower = text.toLowerCase();
            let from = 0;
            let shown = 0;
            while (shown < 3) {
              const idx = lower.indexOf(q, from);
              if (idx === -1) break;
              const start = Math.max(0, idx - 250);
              const end = Math.min(text.length, idx + q.length + 250);
              hits.push(`### Chat: ${title}\n...${truncate(text.slice(start, end), 600)}...`);
              from = idx + q.length;
              shown++;
            }
          }
          for (const m of memories) {
            if ((m.content || "").toLowerCase().includes(q)) {
              hits.push(`### Memoria de la IA local\n${m.content}`);
            }
          }
          return hits.length
            ? `Resultados para "${args.query}":\n\n${truncate(hits.join("\n\n"), MAX_DIGEST_CHARS * 2)}`
            : `Sin resultados para "${args.query}" en la memoria compartida.`;
        },
      }),

      owu_memory_save: tool({
        description:
          "Save an entry to the shared memory: it is stored as an Open WebUI Memory, so the local AI sees it automatically. Use this for important discoveries, decisions, or facts that should persist across sessions and be visible to the local AI.",
        args: {
          content: tool.schema.string().describe("The memory content to save"),
          title: tool.schema.string().optional().describe("Optional short title, prepended to the content"),
        },
        async execute(args) {
          const content = args.title ? `# ${args.title}\n${args.content}` : args.content;
          if (!content.trim()) return "Nothing to save: content is empty.";
          const res = await owu("/api/v1/memories/add", {
            method: "POST",
            body: JSON.stringify({ content }),
          });
          return `Saved to shared memory (Open WebUI Memories). ${res?.id ? `id: ${res.id}` : ""}`;
        },
      }),
    },
  };
};
