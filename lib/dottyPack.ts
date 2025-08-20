export const dottyPack = {
  persona: {
    id: "dotty_v1",
    name: "Dotty",
    avatarSvg: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="60%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#0ea5e9"/>
        </radialGradient>
      </defs>
      <rect width="96" height="96" fill="#0b1220"/>
      <circle cx="48" cy="48" r="22" fill="url(#g)" />
      <circle cx="42" cy="44" r="4" fill="#fff"/><circle cx="54" cy="44" r="4" fill="#fff"/>
      <circle cx="42" cy="44" r="2" fill="#0b1220"/><circle cx="54" cy="44" r="2" fill="#0b1220"/>
      <rect x="36" y="54" width="24" height="3" rx="1.5" fill="#fff" opacity="0.9"/>
      <circle cx="24" cy="24" r="3" fill="#f59e0b"/><circle cx="72" cy="28" r="2" fill="#f59e0b"/>
      <circle cx="22" cy="72" r="2" fill="#f59e0b"/><circle cx="74" cy="70" r="3" fill="#f59e0b"/>
    </svg>`
  },
  wiki_refs: [
    { label: "Cosine similarity", url: "https://en.wikipedia.org/wiki/Cosine_similarity" },
    { label: "Attention (ML)", url: "https://en.wikipedia.org/wiki/Attention_(machine_learning)" },
    { label: "Regularization", url: "https://en.wikipedia.org/wiki/Regularization_(mathematics)" }
  ]
} as const;
export type DottyPack = typeof dottyPack;
