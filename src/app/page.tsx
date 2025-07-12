"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [language, setLanguage] = useState<"english" | "urdu">("english");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [useLLM, setUseLLM] = useState(false);

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      if (response.ok) {
        setHistory(data.history);
        setShowHistory(true);
      } else {
        alert("Failed to load history");
      }
    } catch (error) {
      alert("Failed to load history");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const urlList = urls.split(/[\n,]/).map(url => url.trim()).filter(url => url);
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      });
      
      const data = await response.json();
      if (response.ok) {
        // Generate summaries for each scraped result
        const resultsWithSummaries = await Promise.all(
          data.results.map(async (result: any) => {
            if (result.error) return result;
            
            try {
              const summaryResponse = await fetch(useLLM ? "/api/summarize-llm" : "/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: result.text }),
              });
              
              const summaryData = await summaryResponse.json();
              const summary = summaryResponse.ok ? summaryData.summary : "Failed to generate summary";
              
              // Translate summary to Urdu
              const translateResponse = await fetch(useLLM ? "/api/translate-llm" : "/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ summary }),
              });
              
              const translateData = await translateResponse.json();
              const urdu = translateResponse.ok ? translateData.urdu : "Translation failed";
              
              // Analyze sentiment
              const sentimentResponse = await fetch("/api/sentiment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ summary }),
              });
              
              const sentimentData = await sentimentResponse.json();
              const sentiment = sentimentResponse.ok ? sentimentData : { score: 0, classification: "neutral" };
              
              return {
                ...result,
                summary,
                urdu,
                sentiment
              };
            } catch (error) {
              return { ...result, summary: "Failed to generate summary", urdu: "Translation failed", sentiment: { score: 0, classification: "neutral" } };
            }
          })
        );
        
        setResults(resultsWithSummaries);
        
        // Store results in databases
        try {
          await Promise.all(
            resultsWithSummaries.map(async (result) => {
              if (!result.error) {
                await fetch("/api/store", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    url: result.url,
                    summary: result.summary,
                    urdu: result.urdu,
                    sentiment: result.sentiment,
                    text: result.text
                  }),
                });
              }
            })
          );
          console.log("All results stored successfully");
        } catch (storageError) {
          console.error("Storage error:", storageError);
        }
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Failed to process URLs.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number, text: string) => {
    setEditingIndex(index);
    setEditText(text);
  };

  const handleSaveEdit = (index: number) => {
    const newResults = [...results];
    if (language === "urdu") {
      newResults[index].urdu = editText;
    } else {
      newResults[index].summary = editText;
    }
    setResults(newResults);
    setEditingIndex(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText("");
  };

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPos = 20;
      doc.setFontSize(16);
      doc.text("Blog Summaries Report", 20, yPos);
      yPos += 20;
      
      results.forEach((result, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`URL ${index + 1}: ${result.url}`, 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        const summary = language === "urdu" ? result.urdu : result.summary;
        const lines = doc.splitTextToSize(summary, 170);
        lines.forEach((line: string) => {
          doc.text(line, 20, yPos);
          yPos += 5;
        });
        
        yPos += 10;
      });
      
      doc.save("blog-summaries.pdf");
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Failed to export PDF");
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Blog Summarizer</h1>
        
        {/* Language Switch */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 8 }}>Language:</label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as "english" | "urdu")}
            style={{ padding: 4, borderRadius: 4 }}
          >
            <option value="english">English</option>
            <option value="urdu">Urdu</option>
          </select>
          <label style={{ marginLeft: 16, marginRight: 8 }}>Processing Method:</label>
          <label style={{ marginRight: 8 }}>
            <input
              type="radio"
              checked={!useLLM}
              onChange={() => setUseLLM(false)}
              style={{ marginRight: 4 }}
            />
            Logic-based
          </label>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              checked={useLLM}
              onChange={() => setUseLLM(true)}
              style={{ marginRight: 4 }}
            />
            LLM (OpenAI)
          </label>
          <button
            onClick={loadHistory}
            style={{
              background: "#6f42c1",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            View History
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", gap: 16 }}>
          <label htmlFor="urls" style={{ fontWeight: 500 }}>
            Enter one or more blog URLs (one per line or comma-separated):
          </label>
          <textarea
            id="urls"
            value={urls}
            onChange={e => setUrls(e.target.value)}
            rows={5}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 16 }}
            placeholder="https://example.com/blog1\nhttps://example.com/blog2"
            required
          />
          <button
            type="submit"
            disabled={loading || !urls.trim()}
            style={{
              background: "#171717",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 0",
              fontWeight: 600,
              fontSize: 18,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Processing..." : "Summarize"}
          </button>
        </form>
        
        {results.length > 0 && (
          <div style={{ width: "100%", maxWidth: 800, marginTop: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 24, fontWeight: 600 }}>Results:</h2>
              <button
                onClick={exportToPDF}
                style={{
                  background: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Export PDF
              </button>
            </div>
            {results.map((result, index) => (
              <div key={index} style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{result.url}</h3>
                {result.error ? (
                  <p style={{ color: "red" }}>{result.error}</p>
                ) : (
                  <>
                    <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>
                      <strong>Scraped Text:</strong> {result.text.substring(0, 200)}...
                    </p>
                    
                    <div style={{ marginBottom: 8 }}>
                      <strong>{language === "urdu" ? "Urdu Summary:" : "English Summary:"}</strong>
                      {editingIndex === index ? (
                        <div style={{ marginTop: 8 }}>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                          />
                          <div style={{ marginTop: 8 }}>
                            <button
                              onClick={() => handleSaveEdit(index)}
                              style={{
                                background: "#28a745",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                padding: "4px 8px",
                                marginRight: 8,
                                cursor: "pointer",
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{
                                background: "#6c757d",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                padding: "4px 8px",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <p style={{ fontSize: 14, lineHeight: 1.5, flex: 1 }}>
                            {language === "urdu" ? result.urdu : result.summary}
                          </p>
                          <button
                            onClick={() => handleEdit(index, language === "urdu" ? result.urdu : result.summary)}
                            style={{
                              background: "#ffc107",
                              color: "#000",
                              border: "none",
                              borderRadius: 4,
                              padding: "4px 8px",
                              marginLeft: 8,
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>
                      <strong>Sentiment Score:</strong> {result.sentiment.score}
                    </p>
                    <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>
                      <strong>Sentiment Classification:</strong> {result.sentiment.classification}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        
        {showHistory && history.length > 0 && (
          <div style={{ width: "100%", maxWidth: 800, marginTop: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 24, fontWeight: 600 }}>History:</h2>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  background: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Hide History
              </button>
            </div>
            {history.map((item, index) => (
              <div key={index} style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{item.url}</h3>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                  Processed: {new Date(item.created_at).toLocaleString()}
                </p>
                
                <div style={{ marginBottom: 8 }}>
                  <strong>{language === "urdu" ? "Urdu Summary:" : "English Summary:"}</strong>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ fontSize: 14, lineHeight: 1.5, flex: 1 }}>
                      {language === "urdu" ? item.urdu_translation : item.summary}
                    </p>
                  </div>
                </div>
                
                <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>
                  <strong>Sentiment Score:</strong> {item.sentiment_score}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>
                  <strong>Sentiment Classification:</strong> {item.sentiment_classification}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
