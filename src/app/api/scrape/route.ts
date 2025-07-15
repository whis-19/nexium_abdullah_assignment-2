import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided." }, { status: 400 });
    }

    const results = await Promise.all(
      urls.map(async (url: string) => {
        try {
          const { data } = await axios.get(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          const $ = cheerio.load(data);
          // Try to get main content, fallback to body text
          const main = $("main").text() || $("article").text() || $("body").text();
          return { url, text: main.trim() };
        } catch (_) {
          return { url, error: "Failed to fetch or parse." };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (_) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
} 