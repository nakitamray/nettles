# nettles

An anonymous field for unsent letters.

Every letter grows as a nettle in a dark, overgrown field. Most stay buried and
silent. A few glow like embers, and you can walk up to one and press and hold
to read it. Let go too early and the words disappear. Once you've read it all
the way through, it goes dark for you for good.

There are no profiles, likes or replies. You wander, you read, you leave
something behind if you want to.

Inspired by the Southern Gothic mood of Ethel Cain's music.

## Status

- [x] **Phase 1, the field.** 3D scene, lighting and grain, instanced nettles,
      hold-to-read, planting UI (local only for now)
- [ ] **Phase 2, the backend.** FastAPI service that embeds each letter and
      places it in the field by meaning (sentence-transformers + UMAP)
- [ ] **Phase 3, persistence.** Supabase + pgvector, moderation, accounts for
      uprooting your own letters
- [ ] **Phase 4, launch**

## Stack

- `web/`: Next.js, React Three Fiber, Zustand, postprocessing
- `api/` (coming): Python, FastAPI, PyTorch, umap-learn
- Supabase (Postgres + pgvector)

The ambient sound is generated in the browser with the Web Audio API, so
there are no audio files.

## Running it

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000.

| | |
| --- | --- |
| look around | drag |
| walk | click the ground, or WASD / arrow keys |
| read | click a glowing ember, then press and hold (or hold space) |
| step back | Esc |

## How the field works

- All the nettles are a single `InstancedMesh`. Wind is added in the vertex
  shader, so thousands of stalks sway in one draw call.
- Grass wraps around the camera, so the field never runs out.
- Only four point lights exist. Each frame they move to the embers closest
  to you.
- The tree line moves with you, so you can never reach it.
- Read embers are remembered in `localStorage` for now. They'll move to the
  `ephemeral_reads` table once the backend is up.
