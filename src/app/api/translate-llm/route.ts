import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { summary } = await req.json();
    if (!summary || typeof summary !== "string") {
      return NextResponse.json({ error: "No summary provided." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the given English text to Urdu. Provide only the Urdu translation without any explanations or additional text."
        },
        {
          role: "user",
          content: `Translate this English text to Urdu:\n\n${summary}`
        }
      ],
      max_tokens: 200,
      temperature: 0.1,
    });

    const urdu = completion.choices[0]?.message?.content?.trim() || "Translation failed";

    return NextResponse.json({ urdu });
  } catch (error) {
    console.error('LLM translation error:', error);
    return NextResponse.json({ error: "Failed to translate with LLM." }, { status: 500 });
  }
} 