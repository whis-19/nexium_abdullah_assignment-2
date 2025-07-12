import { NextRequest, NextResponse } from "next/server";

// Simple English to Urdu dictionary (expand as needed)
const dictionary: Record<string, string> = {
  "the": "دی",
  "and": "اور",
  "is": "ہے",
  "in": "میں",
  "to": "کو",
  "of": "کا",
  "a": "ایک",
  "for": "کے لئے",
  "with": "کے ساتھ",
  "on": "پر",
  "as": "طور پر",
  "by": "کی طرف سے",
  "an": "ایک",
  "are": "ہیں",
  "was": "تھا",
  "this": "یہ",
  "that": "وہ",
  // Add more words for better coverage
};

function translateToUrdu(text: string): string {
  return text
    .split(/(\s+)/)
    .map(word => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, "");
      return dictionary[clean] ? dictionary[clean] : word;
    })
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    const { summary } = await req.json();
    if (!summary || typeof summary !== "string") {
      return NextResponse.json({ error: "No summary provided." }, { status: 400 });
    }
    const urdu = translateToUrdu(summary);
    return NextResponse.json({ urdu });
  } catch (error) {
    return NextResponse.json({ error: "Failed to translate." }, { status: 500 });
  }
} 