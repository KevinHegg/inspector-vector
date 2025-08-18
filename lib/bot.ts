import type { BoT } from "./types";
export const DEV_BOT: BoT = {
  version:"1", seed:"local-dev", theme:"Mansion Murder",
  tokens:[
    {id:"suspect.heiress",cluster:"People",role_hints:["S"]},
    {id:"suspect.butler",cluster:"People",role_hints:["S"]},
    {id:"suspect.gardener",cluster:"People",role_hints:["S"]},
    {id:"victim.curator",cluster:"People",role_hints:["V"]},
    {id:"victim.magnate",cluster:"People",role_hints:["V"]},
    {id:"weapon.rope",cluster:"Weapons",role_hints:["W"]},
    {id:"weapon.poison",cluster:"Weapons",role_hints:["W"]},
    {id:"weapon.candlestick",cluster:"Weapons",role_hints:["W"]},
    {id:"room.archives",cluster:"Places",role_hints:["L"]},
    {id:"room.library",cluster:"Places",role_hints:["L"]},
    {id:"room.cellar",cluster:"Places",role_hints:["L"]},
    {id:"evidence.ledger",cluster:"Evidence",role_hints:["E"]},
    {id:"evidence.footprints",cluster:"Evidence",role_hints:["E"]},
    {id:"evidence.glove",cluster:"Evidence",role_hints:["E"]},
    {id:"motive.inheritance",cluster:"Evidence",role_hints:["E"]},
    {id:"motive.jealousy",cluster:"Evidence",role_hints:["E"]},
    {id:"verb.strangle",cluster:"Actions",role_hints:["A"]},
    {id:"verb.poison",cluster:"Actions",role_hints:["A"]},
    {id:"connective.because",cluster:"Connective"},
    {id:"connective.after",cluster:"Connective"},
    {id:"noise.thunderstorm",cluster:"Noise"},
    {id:"noise.cat",cluster:"Noise"},
    {id:"noise.rumor",cluster:"Noise"},
    {id:"noise.carnival_flyer",cluster:"Noise"}
  ],
  synonyms:[["verb.strangle","verb.garrote"],["evidence.ledger","evidence.account_book"]],
  relations_expected:[
    {from:"weapon.rope",to:"verb.strangle",w:0.9},
    {from:"evidence.footprints",to:"room.cellar",w:0.6},
    {from:"evidence.ledger",to:"motive.inheritance",w:0.8}
  ],
  cannot_link:[["room.court","sports.court"]],
  prompt_scaffold:[
    {layer:1,tag:"svo",text:"Who did what to whom?"},
    {layer:2,tag:"place",text:"Where did it occur?"},
    {layer:3,tag:"weapon",text:"What was the weapon?"},
    {layer:4,tag:"evidence",text:"What evidence supports your theory?"},
    {layer:5,tag:"alibi",text:"Whose alibi fails?"},
    {layer:6,tag:"resolve",text:"Resolve contradictions."},
    {layer:7,tag:"temporal",text:"Order key events."},
    {layer:8,tag:"motive",text:"What was the motive?"},
    {layer:9,tag:"synthesis",text:"State the full theory."},
    {layer:10,tag:"boss",text:"Who killed whom, where, with what, and why?"}
  ],
  scoring_config:{thresholds:{coherence:0.8,completeness:0.7},lambda:0.6},
  ui_hints:{role_shapes:{S:"circle",A:"triangle",V:"square",L:"diamond",W:"hex",E:"dot"},
            cluster_colors:{People:"#22d3ee",Weapons:"#f472b6",Places:"#a78bfa",Evidence:"#10b981",Noise:"#64748b"}}
};
