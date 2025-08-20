import { NextRequest, NextResponse } from 'next/server';

export type EvalBossInput = {
  theme: string;
  seed: any;
  layerGrades: number[];
  finalMetrics: { coherence: number; separation: number; coverage: number; energy: number };
  finalSectors: { angle: number; lane: 0 | 1; label?: string; winner?: boolean }[];
};

export type EvalBossOutput = {
  verdict: { who?: string; where?: string; withWhat?: string; confidence: number };
  justification: string;
  boss_score: number;
};

export async function POST(request: NextRequest) {
  try {
    const body: EvalBossInput = await request.json();
    const { theme, layerGrades, finalMetrics, finalSectors } = body;
    
    // TODO: Replace with actual LLM call
    // For now, return deterministic mock evaluation
    
    // Calculate average layer performance
    const avgGrade = layerGrades.reduce((a, b) => a + b, 0) / layerGrades.length;
    
    // Simple boss scoring based on final metrics and layer performance
    const finalScore = Math.min(100, 
      (finalMetrics.coherence * 0.3 + 
       finalMetrics.separation * 0.3 + 
       finalMetrics.coverage * 0.2 + 
       avgGrade * 0.2) * 100
    );
    
    let verdict: any = { confidence: 0.5 };
    let justification = "";
    
    if (theme === "Whodunit") {
      // Analyze final clusters to infer mystery solution
      const anchors = finalSectors.filter(s => s.winner);
      const nonAnchors = finalSectors.filter(s => !s.winner);
      
      if (finalMetrics.coherence >= 0.6 && finalMetrics.separation >= 0.5) {
        // Good clustering - make educated guess
        const weaponCluster = nonAnchors.filter(s => s.label?.includes('weapon'));
        const suspectCluster = nonAnchors.filter(s => s.label?.includes('suspect'));
        const roomCluster = nonAnchors.filter(s => s.label?.includes('room'));
        
        if (weaponCluster.length > 0 && suspectCluster.length > 0 && roomCluster.length > 0) {
          verdict = {
            who: suspectCluster[0]?.label?.replace('suspect.', '').replace(/_/g, ' '),
            where: roomCluster[0]?.label?.replace('room.', ''),
            withWhat: weaponCluster[0]?.label?.replace('weapon.', ''),
            confidence: Math.min(0.9, 0.6 + (finalMetrics.coherence - 0.6) * 0.5)
          };
          
          justification = `Based on your well-organized clusters, the evidence suggests ${verdict.who} in the ${verdict.where} with the ${verdict.withWhat}. Your clustering shows strong coherence (${Math.round(finalMetrics.coherence * 100)}%) and good separation between suspect, location, and weapon groups.`;
        } else {
          justification = "While your clusters are well-organized, the evidence doesn't clearly separate into the three key categories needed to solve the mystery.";
        }
      } else {
        justification = "The evidence is too scattered or overlapping to confidently determine who committed the crime. Focus on creating tighter, more distinct clusters.";
      }
    } else {
      justification = `Final analysis shows ${Math.round(finalMetrics.coherence * 100)}% coherence and ${Math.round(finalMetrics.separation * 100)}% separation. Overall layer performance: ${Math.round(avgGrade * 100)}%.`;
    }
    
    const output: EvalBossOutput = {
      verdict,
      justification,
      boss_score: Math.round(finalScore)
    };
    
    return NextResponse.json(output);
  } catch (error) {
    console.error('Boss evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate boss' },
      { status: 500 }
    );
  }
}
