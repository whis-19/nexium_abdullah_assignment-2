import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }

    // Simple logic-based summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = text.toLowerCase().split(/\s+/);
    
    // Count word frequency
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, "");
      if (cleanWord.length > 3) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });

    // Score sentences based on word frequency
    const sentenceScores = sentences.map(sentence => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const score = sentenceWords.reduce((sum, word) => {
        const cleanWord = word.replace(/[^\w]/g, "");
        return sum + (wordFreq[cleanWord] || 0);
      }, 0);
      return { sentence: sentence.trim(), score };
    });

    // Get top sentences for summary
    const sortedSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(5, Math.ceil(sentences.length * 0.3)));

    const summary = sortedSentences
      .map(item => item.sentence)
      .join(". ") + ".";

    return NextResponse.json({ summary });
  } catch (_) {
    return NextResponse.json({ error: "Failed to generate summary." }, { status: 500 });
  }
} 