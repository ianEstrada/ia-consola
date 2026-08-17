# 🧠 Tu IA local privada — Guía de instalación

Montá tu propia IA (tipo ChatGPT) **en tu PC**: 100% local, privada y gratis.
Sin suscripciones, sin enviar tus chats a nadie, y accesible desde cualquier
lugar con **HTTPS** gracias a Tailscale.

---

## Qué vas a lograr

| Qué | Cómo |
|---|---|
| 🧠 El cerebro (modelo de IA) | **Ollama** — corre en tu PC |
| 💬 La interfaz (chat web) | **Open WebUI** — se abre en tu navegador |
| 🌍 Acceso desde cualquier lugar | **Tailscale** — red privada tuya + HTTPS |

Al final vas a tener una URL tipo `https://tu-pc.tu-tailnet.ts.net:8080`
que abre tu IA desde **cualquier dispositivo con tu cuenta** (celular, otra
PC, donde sea) con conexión cifrada.

---

## Requisitos

- Windows 10/11, macOS o Linux
- **8 GB de RAM** mínimo (16 GB recomendado)
- **10 GB** de disco libre (los modelos pesan)
- Internet (solo para descargar — después funciona sin red)

---

## Paso 1 — Ollama (el cerebro)

1. Descargá e instalá Ollama desde **https://ollama.com/download**
   (siguiente, siguiente, listo. Queda corriendo solo en segundo plano).
2. Abrí una terminal y descargá un modelo de IA:

   ```bash
   ollama pull qwen3.6:35b-a3b
   ```

   ¿PC modesta? Usá el modelo liviano:

   ```bash
   ollama pull qwen3.5:4b o ollama pull gemma4:e4b-it-qta
   ```

3. Verificá que esté:

   ```bash
   ollama list
   ```

   → Ahí aparece tu modelo. Eso es todo el cerebro que necesitás.

> 💡 Los modelos son archivos grandes (3–25+ GB): la descarga tarda según tu internet.

---

## Paso 2 — Open WebUI (la interfaz)

Necesitás **Python** (https://python.org/download → instalá marcando
**"Add python.exe to PATH"**).

Después, en una terminal:

```bash
pip install open-webui
```

Y para encenderla (dejá la terminal abierta):

```bash
open-webui serve
```

Abrí **http://localhost:8080** → creá tu cuenta de administrador
(es la primera vez y la única — guardá esa contraseña).

> 💡 Alternativa con Docker: `docker run -d -p 8080:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main`

---

## Paso 3 — Probar tu IA (local)

1. En el selector de modelo (arriba a la izquierda del chat) elegí tu modelo.
2. Escribile algo. 🎉 ¡Tu IA local está viva!

**¿No aparece tu modelo?** Recargá la página. Si sigue sin aparecer,
verificá que Ollama esté corriendo (`ollama list` en la terminal).

---

## Paso 4 — Tailscale (acceso global con HTTPS)

1. Instalá Tailscale desde **https://tailscale.com/download** e iniciá sesión
   con tu cuenta de Google/Microsoft/GitHub. Tu PC ya está en tu red privada
   (tu *tailnet* — solo tus dispositivos).
2. Activá los certificados HTTPS:
   **https://login.tailscale.com/admin → DNS → activá "HTTPS Certificates"**.
3. Tu URL es: `https://<nombre-de-tu-pc>.<tu-tailnet>.ts.net:8080`
   (el nombre y tailnet los ves en la app de Tailscale).
4. Desde tu celular: instalá Tailscale, iniciá sesión con **la misma cuenta**,
   y abrí esa URL. Tu IA está en tu bolsillo. 📱

> ⚠️ La primera vez desde el celular, tu IA puede tardar unos segundos en
> responder mientras tu PC "despierta" el modelo. Es normal.

---

## Seguridad (leelo, son 10 segundos)

- 🔑 **La contraseña de admin de Open WebUI es tu llave maestra** — no la compartas.
- 🔒 **Tailscale es una red privada**: solo entran dispositivos con TU cuenta.
  Nadie más ve tu IA.
- 🚫 No abras el puerto 8080 al internet público (no hace falta: Tailscale ya te da acceso).

---

## Problemas comunes

| Problema | Solución |
|---|---|
| El modelo no aparece en el chat | Esperá a que termine `ollama pull` y recargá la página |
| No abre `localhost:8080` | La terminal con `open-webui serve` tiene que seguir abierta |
| Todo anda lento | Usá un modelo más chico (`ollama pull llama3.2:3b`) |
| Open WebUI no conecta con Ollama | Ajustes → Conexiones → Ollama: `http://localhost:11434` |
| El modelo corta la respuesta cuando usa herramientas | Aumentá el contexto: `setx OLLAMA_CONTEXT_LENGTH 16384` y reiniciá Ollama |
| Apagué la PC y ahora no hay IA | Volvé a correr `open-webui serve` (Ollama se prende solo) |

---

## (Opcional) Hacé que tu IA te conozca: plantilla de identidad

Open WebUI tiene un apartado de **Memorias**: texto que tu IA SIEMPRE tiene
en cuenta al responderte. Pegale esta plantilla **completada con tus datos**:

**Ajustes → Personalización → Memorias → pegar el texto**

```markdown
## Sobre mí
- **Nombre**:
- **Edad**:
- **Idioma**: (ej: español)
- **Cómo trabajo**: (ej: prefiero contexto largo, respuestas directas)

## Instrucciones para la IA
- Respondeme en mi idioma.
- Enseñame y decime cuando me equivoco, con fundamento técnico.
- Buscá siempre la mejor o las mejores alternativas; nada de respuestas genéricas.

## Mi vida
- **Familia**:
- **Trabajo / estudios**:
- **Proyectos**:
- **Gustos**:
```

Llená cada campo con lo tuyo (o agregá los que quieras: pareja, mascotas,
metas...). Cuanto mejor la completes, más "vos" suena tu IA.

---

## (Opcional) Búsqueda web mejorada con SearXNG + "Optimized Search"

La búsqueda nativa de Open WebUI (`search_web`) devuelve resultados flojos:
dominio de YouTube/TikTok, fuentes viejas, y los modelos casi nunca abren los
links que citan. Esta sección arma una **búsqueda local y privada**:

- **SearXNG** (metabuscador) corre en tu PC en `127.0.0.1:8888` y consulta
  motores sin API key (DuckDuckGo, Wikipedia, Bing, Startpage, Qwant, Marginalia).
- **Tool "Optimized Search" v2.1.1** en Open WebUI: hace la búsqueda en SearXNG
  y **abre las páginas completas** de los mejores resultados (no se queda en los
  snippets), así tu IA cita fuentes reales con contenido.

### 1) Instalá SearXNG

```cmd
git clone --depth 1 https://github.com/searxng/searxng %USERPROFILE%\searxng
cd %USERPROFILE%\searxng
uv venv
uv pip install -r requirements.txt
uv pip install setuptools
uv pip install --no-build-isolation -e .
```

> 💡 En Windows, `python -m searx.webapp` necesita un shim de `pwd` (módulo
> Unix): guardá este archivo como `%USERPROFILE%\searxng\pwd.py`:

```python
import os

def getpwuid(uid):
    class P: pw_name = os.environ.get("USERNAME", "user"); pw_uid = uid; pw_gid = 0; pw_dir = os.path.expanduser("~"); pw_shell = ""
    return P

def getuid():
    return 0
```

### 2) Configurá SearXNG

Creá `%USERPROFILE%\searxng\settings.yml` (generá tu propio `secret_key` con
`python -c "import secrets; print(secrets.token_hex(32))"`):

```yaml
use_default_settings: true
server:
  port: 8888
  bind_address: "127.0.0.1"
  secret_key: "<tu-secret-hex>"
search:
  formats: [html, json]
valkey:
  url: false
engines:
  - name: bing
    disabled: false
  - name: qwant
    disabled: false
  - name: marginalia
    disabled: false
    inactive: false
  - name: youtube
    disabled: true
  - name: google news
    disabled: true
  - name: google cse
    disabled: true
  - name: brave
    disabled: true
```

### 3) Levantalo con `ia.cmd`

El `ia.cmd` de este repo ya maneja SearXNG: al hacer `ia start` levanta
SearXNG oculto en `:8888`, `ia stop` lo apaga solito (mata solo el proceso de
ese puerto, **nunca** tu python de Open WebUI), y `ia status` te dice si está
ON. Probá que responde:

```cmd
curl "http://127.0.0.1:8888/search?q=prueba&format=json"
```

> 🛡️ **Importante:** `ia.cmd` también exporta `DATA_DIR=%USERPROFILE%\open-webui-data`
> para que tus chats y ajustes vivan **fuera** del venv de `uv` — así sobreviven
> a un `uv tool upgrade open-webui`.

### 4) Instalá el tool "Optimized Search" v2.1.1

1. En Open WebUI: **Panel Admin → Espacio de trabajo → Herramientas → +**
   (o Administración → Herramientas, según versión).
2. Pegá el código del tool "Optimized Search" v2.1.1 (tu copia guardada).
   Se llama `optimized_search`. No hace falta instalar nada: depende de
   `httpx` y `beautifulsoup4`, que ya vienen con Open WebUI.
3. En la solapa de **Valores (valves)** del tool, configurá:

| Valve | Valor |
|---|---|
| `SEARXNG_URL` | `http://127.0.0.1:8888` |
| `ALWAYS_FULL_FETCH` | `true` |
| `ENABLE_FULL_FETCH` | `true` |
| `TIMEZONE` | `America/Tijuana` |
| `SHOW_SELECTION_REASONING` | `true` |

### 5) Activá el tool en tus modelos (enfoque A)

Para cada modelo con el que quieras búsqueda real (ej. `gemma4` y `qwen3.6`):

1. **Panel Admin → Espacio de trabajo → Modelos → [modelo] → Capacidades**:
   apagá **"Búsqueda web (Web Search)"** y **"Herramientas integradas (Built-in Tools)"**
   — así no se activa la búsqueda nativa floja.
2. En **Herramientas**, seleccioná **`optimized_search`** y **`fetch_page`**
   (o el tool que lee páginas completas con Playwright).
3. Guardá. Repetí con cada modelo.

> 💡 Dejá activado **Vane** en OFF y `fetch_page` ON: `optimized_search` busca,
> abre las páginas completas y cita las fuentes reales en la respuesta.

### Solución de problemas

| Problema | Solución |
|---|---|
| `ia status` dice SearXNG OFF | Corré `ia start` de nuevo o mirá el log: `%USERPROFILE%\searxng\logs\searxng.log` |
| El modelo responde sin fuentes | Verificá que el tool esté **activado en el modelo** y que los valves apunten a `127.0.0.1:8888` |
| La búsqueda devuelve CAPTCHA/sorry de un motor | Es el sitio externo (DuckDuckGo/Startpage a veces bloquean); los demás motores (Bing, Wikipedia, Qwant, Marginalia) siguen funcionando |
| Querés volver a la búsqueda nativa | Reactivá "Web Search"/"Built-in Tools" en el modelo y desactivá el tool |

---

## Conectar opencode a tu IA local (opcional)

¿Usás [opencode](https://opencode.ai)? Podés **enlazarlo con tu IA local**
para que compartan una sola memoria: los chats de Open WebUI taggeados con
**`link`** + las Memorias quedan visibles para opencode, y lo que opencode
guarda aparece en las Memorias de tu IA local. Todo lo demás se ignora.

### Configuración manual

1. **Copiá el plugin** `plugin/owu-memory.ts` a la carpeta de plugins de
   opencode: `~/.config/opencode/plugins/` (o `.opencode/plugins/` del proyecto).
2. **Creá una API key** en tu Open WebUI: Ajustes → Cuenta → Claves API → Crear.
3. **Agregá la config** a tu `opencode.json`:

   ```json
   {
     "env": {
       "OWU_URL": "http://localhost:8080",
       "OWU_API_KEY": "sk-…",
       "OWU_MEMORY_TAG": "link"
     }
   }
   ```

4. **Reiniciá opencode.**

Después, taggeá con `link` cualquier chat de tu IA local que quieras
compartir con opencode. Detalles y solución de problemas:
[`plugin/README.md`](plugin/README.md).

---

## Resumen de comandos

```bash
ollama pull qwen3:8b        # descargar modelo (una vez)
open-webui serve            # encender la IA (cada vez que prendas la PC)
ollama list                 # ver modelos instalados
```

**Atajo Windows (opcional):** bajá [`scripts/ia.cmd`](scripts/ia.cmd) a una
carpeta que esté en tu PATH (por ejemplo `C:\Users\<tu-usuario>\bin`) y
usá un solo comando:

```cmd
ia start      :: levanta Tailscale + Ollama + Open WebUI + SearXNG
ia stop       :: apaga todo (SearXNG se apaga por su puerto, sin tocar tu python)
ia status     :: muestra qué está encendido
```

¡Listo! Tenés tu IA local, privada y global. 🌎
