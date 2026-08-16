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
ia start      :: levanta Tailscale + Ollama + Open WebUI
ia stop       :: apaga todo
ia status     :: muestra qué está encendido
```

¡Listo! Tenés tu IA local, privada y global. 🌎
