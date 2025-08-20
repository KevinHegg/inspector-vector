import { NextResponse } from "next/server";

// Simple daily pack (tokens trimmed for brevity)
export async function GET() {
  const pack = {
    theme: "Mansion Mystery",
    persona: {
      id: "dotty_v1",
      name: "Dotty",
      // UI uses lib/dottyPack.ts avatar; this is here for completeness
    },
    ui_hints: {
      cluster_colors: { suspects: "#f472b6", evidence: "#22d3ee", locations: "#a78bfa", actions: "#f59e0b" }
    },
    tokens: [
      { id: "suspect.professor_plum" }, { id: "suspect.miss_scarlet" }, { id: "suspect.colonel_mustard" },
      { id: "evidence.fingerprint" }, { id: "evidence.note" }, { id: "evidence.glove" },
      { id: "location.library" }, { id: "location.study" }, { id: "location.kitchen" },
      { id: "action.confront" }, { id: "action.hide" }, { id: "action.escape" },
      { id: "concept.alibi" }, { id: "concept.motive" }, { id: "concept.opportunity" },
      { id: "time.midnight" }, { id: "time.evening" }, { id: "time.dawn" },
      { id: "weapon.candlestick" }, { id: "weapon.rope" }, { id: "weapon.wrench" },
      { id: "verb.confess" }, { id: "verb.accuse" }, { id: "verb.search" },
      { id: "object.watch" }, { id: "object.key" }, { id: "object.letter" },
      { id: "role.butler" }, { id: "role.detective" }, { id: "role.guest" },
      { id: "trait.nervous" }, { id: "trait.calm" }, { id: "trait.deceptive" },
      { id: "misc.shadow" }, { id: "misc.footsteps" }, { id: "misc.window" }
    ],
    prompt_scaffold: [
      { layer: 1, text: "Which tokens look related? Try comparing two with cosine." },
      { layer: 2, text: "Form early clusters (suspects, evidence, locations)." },
      { layer: 3, text: "Tighten clusters; separate unlike concepts." },
      { layer: 4, text: "Link evidence to suspects or locations." },
      { layer: 5, text: "Resolve ambiguities (conflicting links)." },
      { layer: 6, text: "Create a plausible timeline." },
      { layer: 7, text: "Hypothesize a culprit and method." },
      { layer: 8, text: "Check consistency of motive/opportunity." },
      { layer: 9, text: "Refine; remove noisy links." },
      { layer: 10, text: "Boss prompt: Who did it, where, and how?" }
    ],
    boss: {
      prompt: "Based on the clusters and relationships you've built, who committed the crime, where did it happen, and what weapon or method was used? Justify your answer using the strongest cosine similarities and cluster patterns."
    }
  };
  return NextResponse.json(pack);
}
