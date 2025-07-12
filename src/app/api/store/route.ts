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

export async function POST(req: NextRequest) {
  try {
    const { url, summary, urdu, sentiment, text } = await req.json();
    
    if (!url || !summary) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Store summary in Supabase
    const { error: supabaseError } = await supabase
      .from('summaries')
      .insert([
        {
          url,
          summary,
          urdu_translation: urdu,
          sentiment_score: sentiment?.score || 0,
          sentiment_classification: sentiment?.classification || 'neutral',
          created_at: new Date().toISOString()
        }
      ]);

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
    }

    // Store full text in MongoDB
    await dbConnect();
    await BlogText.create({
      url,
      text
    });

    return NextResponse.json({ 
      success: true, 
      message: "Data stored successfully" 
    });

  } catch (error) {
    console.error('Storage error:', error);
    return NextResponse.json({ 
      error: "Failed to store data." 
    }, { status: 500 });
  }
} 