import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, informative summaries of blog content. Focus on the main points and key insights."
        },
        {
          role: "user",
          content: `Please summarize the following blog content in 2-3 sentences:\n\n${text}`
        }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || "Failed to generate summary";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('LLM summarization error:', error);
    return NextResponse.json({ error: "Failed to generate summary with LLM." }, { status: 500 });
  }
} 