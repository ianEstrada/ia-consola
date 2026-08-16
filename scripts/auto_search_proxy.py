"""
auto-search proxy — el patron ChatGPT para tu IA local.

Intercepta cada chat, detecta preguntas que necesitan informacion actual
(productos, juegos, "nuevo/reciente", precios, rankings...), ejecuta la busqueda
web SOLO (server-side, sin depender del modelo) e inyecta los resultados en el
contexto ANTES de que el modelo responda.

Flujo: OWU -> este proxy -> [buscar + inyectar] -> OWU (chat/completions) -> Ollama
"""
import json
import re
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse

OWU_URL = "http://localhost:8080"
OWU_KEY = "sk-ef93fe1aa5544b47bdf8f614ec4d85aa"
PORT = 9099

# Estrategia GENERAL: buscar SIEMPRE excepto saludos/corto/mates (blacklist, no whitelist)
NO_SEARCH = re.compile(
    r"^(hola|buenos días|buenas|buen día|gracias|ok|okey|dale|listo|sí|si|no|jaja|xd|perfecto|genial|excelente|entendido)[\s!.,]*$",
    re.IGNORECASE,
)
MATH_ONLY = re.compile(r"^[\d\s+\-*/×÷^().,]+$")


def needs_search(text: str) -> bool:
    t = text.strip()
    if len(t) < 8:                      # muy corto (saludos cortos, ok, si)
        return False
    if NO_SEARCH.match(t):              # frases sociales exactas
        return False
    if MATH_ONLY.match(t):              # mates puras (17*23)
        return False
    return True                         # TODO lo demas -> buscar siempre

RAG_TEMPLATE = """### Tarea:
Respondé a la consulta del usuario usando SOLO el contexto provisto.

### Reglas:
- Basá tu respuesta 100% en el contexto. PROHIBIDO usar tu conocimiento de
  entrenamiento para datos actuales (jugadores, precios, lanzamientos, noticias).
- Si el contexto no responde la pregunta: decilo claro y ofrecé buscar más.
  PROHIBIDO inventar nombres, precios o datos.
- Nunca digas "no sé" o "revisá otra fuente" sin responder antes con lo mejor del contexto.
- Respondé en el idioma del usuario.
- Citá las fuentes con [id] cuando el tag <source> tenga id. No uses XML en la respuesta.

<context>
{CONTEXT}
</context>"""


async def web_search(query: str) -> list:
    """Busca via la API de OWU (usa el motor configurado: Tavily/DDGS)."""
    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.post(
            f"{OWU_URL}/api/v1/retrieval/process/web/search",
            headers={"Authorization": f"Bearer {OWU_KEY}", "Content-Type": "application/json"},
            json={"queries": [query]},
        )
        if r.status_code != 200:
            return []
        data = r.json()
        items = data.get("items") or []
        return [
            {"title": it.get("title", ""), "url": it.get("link", ""), "content": (it.get("snippet") or it.get("content") or "")[:800]}
            for it in items
        ]


def build_context(results: list) -> str:
    sources = []
    for i, it in enumerate(results, start=1):
        sources.append(
            f'<source id="{i}">\n<title>{it["title"]}</title>\n<url>{it["url"]}</url>\n<content>{it["content"]}</content>\n</source>'
        )
    return RAG_TEMPLATE.format(CONTEXT="\n".join(sources))


def strip_prefix(model: str) -> str:
    for p in ("auto-", "auto_"):
        if model.startswith(p):
            return model[len(p):]
    return model


app = FastAPI(title="auto-search-proxy")


@app.get("/v1/models")
async def models():
    return {
        "object": "list",
        "data": [
            {"id": "auto-qwen3.6:35b-a3b", "object": "model", "owned_by": "auto-search"},
            {"id": "auto-gemma4:e4b-it-qat", "object": "model", "owned_by": "auto-search"},
        ],
    }


@app.api_route("/v1/chat/completions", methods=["POST"])
async def chat_completions(request: Request):
    body = await request.json()
    messages = list(body.get("messages", []))
    model = strip_prefix(body.get("model", ""))

    # 1) Detectar si el ultimo mensaje del usuario necesita busqueda
    last_user = next((m for m in reversed(messages) if m.get("role") == "user"), None)
    injected = False
    if last_user and needs_search(last_user.get("content", "")):
        # Query: el mensaje; si es corto/ambiguo (follow-up), agrega el mensaje anterior
        query = last_user["content"]
        if len(query) < 24:
            prev_user = next((m["content"] for m in reversed(messages[:-1]) if m.get("role") == "user"), "")
            if prev_user:
                query = f"{prev_user} {query}"
        # 2) Buscar SOLO (server-side) — 2 queries: espanol + ingles
        results = await web_search(query)
        if not results and re.search(r"[a-zA-Z]", query):
            results = await web_search(f"{query} 2026 latest")
        if results:
            # 3) Inyectar contexto con el template anti-fallback
            messages.append({"role": "system", "content": build_context(results)})
            injected = True

    # 4) Reenviar a OWU (que maneja tools, memoria, etc.) y relayear la respuesta
    forward = dict(body)
    forward["model"] = model
    forward["messages"] = messages

    # Cliente SIN context manager: en streaming debe vivir hasta que el stream termine
    client = httpx.AsyncClient(timeout=600)
    upstream = client.build_request(
        "POST", f"{OWU_URL}/api/chat/completions",
        headers={"Authorization": f"Bearer {OWU_KEY}", "Content-Type": "application/json"},
        json=forward,
    )
    if body.get("stream"):
        req = await client.send(upstream, stream=True)
        if req.status_code != 200:
            body_bytes = await req.aread()
            await client.aclose()
            return JSONResponse(status_code=req.status_code, content=json.loads(body_bytes or b"{}"))

        async def stream_gen():
            try:
                async for chunk in req.aiter_raw():
                    yield chunk
            finally:
                await req.aclose()
                await client.aclose()

        return StreamingResponse(stream_gen(), media_type="text/event-stream")
    resp = await client.send(upstream)
    await client.aclose()
    return JSONResponse(status_code=resp.status_code, content=resp.json())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
