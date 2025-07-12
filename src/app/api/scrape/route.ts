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
          const { data } = await axios.get(url);
          const $ = cheerio.load(data);
          // Try to get main content, fallback to body text
          const main = $("main").text() || $("article").text() || $("body").text();
          return { url, text: main.trim() };
        } catch (err) {
          return { url, error: "Failed to fetch or parse." };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
} 