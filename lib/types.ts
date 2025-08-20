export type Token = { id: string; cluster?: string; role_hints?: string[] };
export type Relation = { from: string; to: string; w?: number };
export type Prompt = { layer: number; text: string };
export type BoT = {
  theme: string;
  tokens: Token[];
  ui_hints: {
    cluster_colors: Record<string, string>;
  };
  prompt_scaffold: Prompt[];
  boss?: {
    prompt: string;
  };
};
