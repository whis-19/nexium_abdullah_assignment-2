import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

// MongoDB Schema for full text storage
const BlogTextSchema = new mongoose.Schema({
  url: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const BlogText = mongoose.models.BlogText || mongoose.model('BlogText', BlogTextSchema);

export async function GET(req: NextRequest) {
  try {
    // Get summaries from Supabase
    const { data: summaries, error: supabaseError } = await supabase
      .from('summaries')
      .select('*')
      .order('created_at', { ascending: false });

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
    }

    // Get full text from MongoDB
    await dbConnect();
    const fullTexts = await BlogText.find().sort({ timestamp: -1 });

    // Combine the data
    const history = summaries?.map((summary: any) => {
      const fullText = fullTexts.find((text: any) => text.url === summary.url);
      return {
        url: summary.url,
        summary: summary.summary,
        urdu_translation: summary.urdu_translation,
        sentiment_score: summary.sentiment_score,
        sentiment_classification: summary.sentiment_classification,
        created_at: summary.created_at,
        full_text: fullText?.text || "Full text not found"
      };
    }) || [];

    return NextResponse.json({ history });
  } catch (error) {
    console.error('History retrieval error:', error);
    return NextResponse.json({ 
      error: "Failed to retrieve history." 
    }, { status: 500 });
  }
} 