# owu-memory — conectá opencode con tu IA local

`owu-memory` es un plugin de opencode que **enlaza** tu IA local
(Open WebUI) con opencode: comparten **una sola memoria** — la de
Open WebUI — sin copias, sin servidores extra.

- **Leer**: todo chat de Open WebUI **taggeado con `link`** + las
  Memorias de tu IA local quedan disponibles para opencode.
- **Escribir**: cuando opencode guarda algo en memoria, se guarda en
  las **Memorias de Open WebUI** y tu IA local lo ve automáticamente.
- **Ignorar**: todo lo que no esté taggeado se ignora. Cero
  contaminación.

```
┌────────────────────┐   HTTP + API key   ┌─────────────────────────┐
│      opencode      │ ◄────────────────► │   Open WebUI (local)    │
│  plugin owu-memory │     (REST API)     │  chats · tags · memorias│
└────────────────────┘                    └─────────────────────────┘
```

---

## Requisitos

- [opencode](https://opencode.ai) instalado
- Tu IA local funcionando (Ollama + Open WebUI — ver la guía principal)
- Tu cuenta de administrador de Open WebUI

## Instalación (manual, paso a paso)

### 1. Copiá el plugin

Copiá el archivo `owu-memory.ts` a la carpeta de plugins de opencode:

- **Global (todos tus proyectos)**:
  - Windows: `C:\Users\<tu-usuario>\.config\opencode\plugins\`
  - macOS/Linux: `~/.config/opencode/plugins/`
- **Solo un proyecto**: `.opencode/plugins/` dentro del proyecto

### 2. Creá una API key en Open WebUI

1. Entrá a tu Open WebUI → **Ajustes → Cuenta → Claves API**
2. **Crear** una clave nueva → copiala (empieza con `sk-...`)

### 3. Configurá las variables en `opencode.json`

Agregá (o creá) el archivo `opencode.json` de opencode con esta
sección `env`:

```json
{
  "env": {
    "OWU_URL": "http://localhost:8080",
    "OWU_API_KEY": "sk-…",
    "OWU_MEMORY_TAG": "link"
  }
}
```

| Variable | Qué es | Default |
|---|---|---|
| `OWU_URL` | Dirección de tu Open WebUI | `http://localhost:8080` |
| `OWU_API_KEY` | La clave que creaste en el paso 2 | — (obligatoria) |
| `OWU_MEMORY_TAG` | Tag que marca los chats compartidos | `link` |

> 🌍 ¿Accedés por Tailscale? Usá tu URL remota:
> `https://<tu-pc>.<tu-tailnet>.ts.net:8080`

### 4. Reiniciá opencode

Cerralo y abrilo de nuevo. El plugin carga solo.

---

## Cómo usarlo

### Compartir un chat con opencode (leer)

1. En Open WebUI, abrí el chat que quieras compartir.
2. Taggealo con **`link`**: en el chat, menú ⋮ → **Editar tags** →
   escribí `link`.
3. Listo. opencode lo ve automáticamente:

- Al **iniciar una sesión**, opencode recibe un resumen de tus chats
  taggeados + memorias (el "digest").
- Cuando necesite detalles, usa las herramientas:

| Herramienta | Qué hace |
|---|---|
| `owu_memory_list` | Muestra los chats compartidos + memorias |
| `owu_memory_search` | Busca un texto en la memoria compartida |
| `owu_memory_save` | Guarda una entrada en las Memorias de OWU |

Podés pedírselo directamente: *"revisá mi memoria"*,
*"buscá en mis chats taggeados si hablamos de X"*,
*"guardá en memoria que el deploy va los martes"*.

### Comprobar que funciona

Escribile a opencode: **"¿qué hay en mi memoria compartida?"**
Si ves tus chats taggeados o memorias → funcionó. 🎉

---

## Solución de problemas

| Problema | Causa / solución |
|---|---|
| `OWU_API_KEY is not configured` | Falta `OWU_API_KEY` en `env` de `opencode.json` (reiniciá después) |
| `HTTP 401` | La API key no es válida — regenerala en Ajustes → Cuenta → Claves API |
| `HTTP 404` en `/memories` | Open WebUI viejo; actualizalo o avisá en un issue |
| No aparece el digest al iniciar | Los chats sin tag no cuentan; taggeá un chat con `link` |
| OWU en otra PC y no conecta | Verificá que la URL de Tailscale termine en `:8080` y esté encendida |
