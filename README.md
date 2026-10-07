# nettles

A quiet field for the things you never got to say.

Every letter grows as a nettle in a misty field under weeping willows. Most
are buried and stay silent. A few glow softly, and if you walk up to one and
hold, you can read it. Let go too early and the words slip away. Once you've
read it all the way through, its light goes out for you, and it gets to rest.

There are no profiles, likes or replies. It's meant to be a soft place to be
honest. You wander, you read, you set something down if you want to.

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

Sound: if `web/public/audio/ambience.mp3` exists it loops in the background.
If it doesn't, a soft pad with chimes and birdsong is generated in the browser.

Fonts: the handwriting fonts are licensed separately, so they aren't in this
repo. Free Google fonts are used in their place.

## Running it

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000.

Click into the field to start. It works like a first-person game:

| | |
| --- | --- |
| look around | mouse |
| walk / step back | W / S |
| drift sideways | A / D |
| read | point at a glowing letter and hold click (or space) |
| pause | Esc |
| mute | M |

On phones you drag to look around, and there are buttons for walking and reading.

## How the field works

- All the nettles are a single `InstancedMesh`. Wind is added in the vertex
  shader, so thousands of stalks sway in one draw call.
- Grass wraps around the camera, so the field never runs out.
- Only four point lights exist. Each frame they move to the embers closest
  to you.
- The willows are built in code: tapered trunks, arching limbs and a few
  hundred hanging strands. Each strand carries its own sway weight, so the
  tips move the most.
- The beams of light are slanted quads that turn to face you around the
  sun's direction, blended additively into the mist.
- The tree line moves with you, so you can never reach it.
- Read embers are remembered in `localStorage` for now. They'll move to the
  `ephemeral_reads` table once the backend is up.
