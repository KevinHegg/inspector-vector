# Inspector Vector – Roadmap (MVP -> v1)

MVP (this week)
- Persist 10 layer snapshots in memory; ladder scrubbing works.
- Action log per layer (advance/retry ops) -> send to /api/score.
- Energy economy tune + UI feedback (disabled Advance at 0 energy).
- Simple flourish: token glow on “winner” + beam on spokes.

v0.2
- Ladder edit mode: overwrite-vs-fork option & UI.
- Layer summary card (meters + short caption) under canvas.

v0.3
- Boss prompt screen: compile layer 10 into a narrative (no LLM yet).
- Export/import game state JSON.

v1
- Plug in judge LLM (server route), rate-limited; Netlify env vars.
- Daily puzzle seed + leaderboard (serverless KV or Neon).
