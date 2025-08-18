export type Token={id:string;cluster:"People"|"Weapons"|"Places"|"Evidence"|"Noise"|"Actions"|"Connective";role_hints?:string[]};
export type Relation={from:string;to:string;w?:number};
export type Prompt={layer:number;tag:string;text:string};
export type BoT={version:string;seed:string;theme:string;tokens:Token[];synonyms:[string,string][];relations_expected:Relation[];
cannot_link:[string,string][];prompt_scaffold:Prompt[];scoring_config:{thresholds:{coherence:number;completeness:number};lambda:number};
ui_hints:{role_shapes:Record<string,string>;cluster_colors:Record<string,string>}};
