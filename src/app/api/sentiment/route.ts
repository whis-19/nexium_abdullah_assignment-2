import { NextRequest, NextResponse } from "next/server";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

export async function POST(req: NextRequest) {
  try {
    const { summary } = await req.json();
    if (!summary || typeof summary !== "string") {
      return NextResponse.json({ error: "No summary provided." }, { status: 400 });
    }

    const result = sentiment.analyze(summary);
    
    // Classify sentiment based on score
    let classification = "neutral";
    if (result.score > 0) {
      classification = "positive";
    } else if (result.score < 0) {
      classification = "negative";
    }

    return NextResponse.json({
      score: result.score,
      classification,
      comparative: result.comparative,
      tokens: result.tokens.length,
      positive: result.positive,
      negative: result.negative
    });
  } catch (_) {
    return NextResponse.json({ error: "Failed to analyze sentiment." }, { status: 500 });
  }
} 