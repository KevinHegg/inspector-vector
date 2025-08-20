// lib/sidekickPack.ts
export type TutorRule = {
  when: string;                    // simple keys your code resolves
  say: string[];                   // one line is picked
  cta?: { action: string; label: string; args?: any };
};

export const sidekickPack = {
  persona: {
    id: "wattson_v1",
    name: "Wattson",
    avatarSvg: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" fill="#0b1220"/>
      <rect x="10" y="10" width="76" height="54" fill="#101827" stroke="#22d3ee" stroke-width="2"/>
      <rect x="18" y="18" width="60" height="38" fill="#0b1220" />
      <g opacity="0.14">
        <rect x="18" y="20" width="60" height="1" fill="#fff"/><rect x="18" y="24" width="60" height="1" fill="#fff"/>
        <rect x="18" y="28" width="60" height="1" fill="#fff"/><rect x="18" y="32" width="60" height="1" fill="#fff"/>
        <rect x="18" y="36" width="60" height="1" fill="#fff"/><rect x="18" y="40" width="60" height="1" fill="#fff"/>
        <rect x="18" y="44" width="60" height="1" fill="#fff"/><rect x="18" y="48" width="60" height="1" fill="#fff"/>
      </g>
      <!-- pixel face -->
      <rect x="34" y="26" width="4" height="4" fill="#22d3ee"/><rect x="58" y="26" width="4" height="4" fill="#22d3ee"/>
      <rect x="38" y="36" width="24" height="4" fill="#22d3ee"/>
      <!-- monocle -->
      <circle cx="60" cy="28" r="8" fill="none" stroke="#f59e0b" stroke-width="2"/>
      <line x1="60" y1="36" x2="60" y2="44" stroke="#f59e0b" stroke-width="2"/>
      <!-- name plate -->
      <rect x="28" y="68" width="40" height="16" rx="2" fill="#0b1220" stroke="#22d3ee" stroke-width="2"/>
      <text x="48" y="80" font-size="8" fill="#22d3ee" text-anchor="middle" font-family="ui-monospace,Menlo">WATTSON</text>
    </svg>`
  },
  coach_rules: [
    {
      when: "cosine_off",
      say: ["Let’s see relations, chief—flip on Cosine and pick two vectors."],
      cta: { action: "toggleCosine", label: "Enable Cosine", args: true }
    },
    {
      when: "need_two_selected",
      say: ["Two’s company: select one more token to measure cos Δ."],
    },
    {
      when: "low_coherence",
      say: ["Petals are droopy. Stabilize or Magnetize to tighten clusters."],
      cta: { action: "stabilize", label: "Stabilize (25%)", args: { strength: 0.25 } }
    },
    {
      when: "low_separation",
      say: ["Crowding detected. Spread from a selected anchor or use a targeted Beam."],
      cta: { action: "spread", label: "Spread (select one)", args: { anchorHint: "selectOne", amount: 0.3 } }
    },
    {
      when: "good_but_sparse",
      say: ["We’ve got shape, not structure. Link evidence between related tokens."],
      cta: { action: "link", label: "Link evidence" }
    },
    {
      when: "default",
      say: ["Try comparing two new tokens, then nudge with Beam or Magnetize."]
    }
  ],
  wiki_refs: [
    { label: "Cosine similarity", url: "https://en.wikipedia.org/wiki/Cosine_similarity" },
    { label: "Attention", url: "https://en.wikipedia.org/wiki/Attention_(machine_learning)" },
    { label: "Regularization", url: "https://en.wikipedia.org/wiki/Regularization_(mathematics)" }
  ]
};
export type SidekickPack = typeof sidekickPack;
