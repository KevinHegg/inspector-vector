import { NextRequest, NextResponse } from 'next/server';

export type EvalLayerInput = {
  theme: string;
  layerIndex: number;
  prompt: string;
  metrics: { coherence: number; separation: number; coverage: number; energy: number };
  sectors: { angle: number; lane: 0 | 1; label?: string; winner?: boolean }[];
  selected?: number[];
};

export type EvalLayerOutput = {
  explanation: string;
  suggestions: string[];
  grade: number;
  rubric: {
    coherence: number;
    separation: number;
    coverage: number;
    energyUse: number;
    overall: number;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body: EvalLayerInput = await request.json();
    
    // TODO: Replace with actual LLM call
    // For now, return deterministic mock evaluation
    const { metrics, theme, layerIndex } = body;
    
    // Simple scoring logic (can be enhanced later)
    const coherenceScore = Math.min(1, metrics.coherence / 0.55);
    const separationScore = Math.min(1, metrics.separation / 0.35);
    const coverageScore = metrics.coverage;
    const energyScore = Math.max(0, 1 - (100 - metrics.energy) / 100);
    
    const overall = (coherenceScore * 0.4 + separationScore * 0.3 + coverageScore * 0.2 + energyScore * 0.1);
    
    // Generate contextual explanation based on theme and metrics
    let explanation = "";
    if (theme === "Whodunit") {
      if (metrics.coherence >= 0.6) {
        explanation = "Excellent clustering! Your evidence is well-organized around key suspects and locations.";
      } else if (metrics.coherence >= 0.4) {
        explanation = "Good progress on organizing evidence. Some clusters are forming but could be tighter.";
      } else {
        explanation = "Evidence is scattered. Focus on grouping related tokens together first.";
      }
      
      if (metrics.separation < 0.3) {
        explanation += " Watch out for overlapping clusters - you want distinct groups for different suspects.";
      }
    } else {
      explanation = `Layer ${layerIndex} shows ${Math.round(metrics.coherence * 100)}% coherence and ${Math.round(metrics.separation * 100)}% separation.`;
    }
    
    // Generate suggestions based on current state
    const suggestions: string[] = [];
    if (metrics.coherence < 0.5) {
      suggestions.push("Use Stabilize to tighten existing clusters");
      suggestions.push("Try Magnetize on your strongest anchor token");
    }
    if (metrics.separation < 0.4) {
      suggestions.push("Use Spread to separate overlapping clusters");
      suggestions.push("Consider Rotate to better align with the grid");
    }
    if (metrics.coverage < 0.6) {
      suggestions.push("Use Beam to pull tokens toward anchors");
      suggestions.push("Ensure each anchor has at least 3 supporting tokens");
    }
    
    const output: EvalLayerOutput = {
      explanation,
      suggestions: suggestions.slice(0, 3),
      grade: overall,
      rubric: {
        coherence: coherenceScore,
        separation: separationScore,
        coverage: coverageScore,
        energyUse: energyScore,
        overall
      }
    };
    
    return NextResponse.json(output);
  } catch (error) {
    console.error('Layer evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate layer' },
      { status: 500 }
    );
  }
}
