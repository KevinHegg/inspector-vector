import type { BoT } from "./types";
export const DEV_BOT: BoT = {
  theme: "Mansion Murder",
  tokens: [
    {id: "suspect.heiress", cluster: "People", role_hints: ["S"]},
    {id: "suspect.butler", cluster: "People", role_hints: ["S"]},
    {id: "suspect.gardener", cluster: "People", role_hints: ["S"]},
    {id: "victim.curator", cluster: "People", role_hints: ["V"]},
    {id: "victim.magnate", cluster: "People", role_hints: ["V"]},
    {id: "weapon.rope", cluster: "Weapons", role_hints: ["W"]},
    {id: "weapon.poison", cluster: "Weapons", role_hints: ["W"]},
    {id: "weapon.candlestick", cluster: "Weapons", role_hints: ["W"]},
    {id: "room.archives", cluster: "Places", role_hints: ["L"]},
    {id: "room.library", cluster: "Places", role_hints: ["L"]},
    {id: "room.cellar", cluster: "Places", role_hints: ["L"]},
    {id: "evidence.ledger", cluster: "Evidence", role_hints: ["E"]},
    {id: "evidence.footprints", cluster: "Evidence", role_hints: ["E"]},
    {id: "evidence.glove", cluster: "Evidence", role_hints: ["E"]},
    {id: "motive.inheritance", cluster: "Evidence", role_hints: ["E"]},
    {id: "motive.jealousy", cluster: "Evidence", role_hints: ["E"]},
    {id: "verb.strangle", cluster: "Actions", role_hints: ["A"]},
    {id: "verb.poison", cluster: "Actions", role_hints: ["A"]},
    {id: "connective.because", cluster: "Connective"},
    {id: "connective.after", cluster: "Connective"},
    {id: "noise.thunderstorm", cluster: "Noise"},
    {id: "noise.cat", cluster: "Noise"},
    {id: "noise.rumor", cluster: "Noise"},
    {id: "noise.carnival_flyer", cluster: "Noise"}
  ],
  prompt_scaffold: [
    {layer: 1, text: "Who did what to whom?"},
    {layer: 2, text: "Where did it occur?"},
    {layer: 3, text: "What was the weapon?"},
    {layer: 4, text: "What evidence supports your theory?"},
    {layer: 5, text: "Whose alibi fails?"},
    {layer: 6, text: "Resolve contradictions."},
    {layer: 7, text: "Order key events."},
    {layer: 8, text: "What was the motive?"},
    {layer: 9, text: "State the full theory."},
    {layer: 10, text: "Who killed whom, where, with what, and why?"}
  ],
  boss: {
    prompt: "Based on the clusters and relationships you've built, who committed the crime, where did it happen, and what weapon or method was used? Justify your answer using the strongest cosine similarities and cluster patterns."
  },
  ui_hints: {
    cluster_colors: {
      People: "#22d3ee",
      Weapons: "#f472b6", 
      Places: "#a78bfa",
      Evidence: "#10b981",
      Noise: "#64748b"
    }
  }
};
