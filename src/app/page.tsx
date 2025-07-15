"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { Search, Volume2 } from "lucide-react";

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
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      if (response.ok) {
        setHistory(data.history);
        setShowHistory(true);
      } else {
        toast({ title: "Failed to load history", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to load history", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);
    try {
      const urlList = urls.split(/[\n,]/).map(url => url.trim()).filter(url => url);
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      });
      const data = await response.json();
      if (response.ok) {
        const resultsWithSummaries = await Promise.all(
          data.results.map(async (result: any) => {
            if (result.error) return result;
            try {
              const summaryResponse = await fetch(useLLM ? "/api/summarize-llm" : "/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: result.text, language }), // Pass language
              });
              const summaryData = await summaryResponse.json();
              let summary = summaryResponse.ok ? summaryData.summary : "Failed to generate summary";
              let urdu = "";
              if (language === "urdu") {
                urdu = summary;
                // Optionally, translate to English if you want both fields filled
                // Or leave summary (English) blank or use translation endpoint
              } else {
                // English summary, translate to Urdu as before
                const translateResponse = await fetch(useLLM ? "/api/translate-llm" : "/api/translate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ summary }),
                });
                const translateData = await translateResponse.json();
                urdu = translateResponse.ok ? translateData.urdu : "Translation failed";
              }
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
          toast({ title: "All results stored successfully", variant: "default" });
        } catch (storageError) {
          toast({ title: "Storage error", description: String(storageError), variant: "destructive" });
        }
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to process URLs", variant: "destructive" });
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
    toast({ title: "Summary updated", variant: "default" });
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
      toast({ title: "PDF exported", variant: "default" });
    } catch (error) {
      toast({ title: "Failed to export PDF", variant: "destructive" });
    }
  };

  // Text-to-Speech function
  const speak = (text: string, lang: string = "en-US") => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="responsive-container flex flex-col items-center min-h-screen bg-white">
      <Card className="w-full max-w-xl mt-20 p-0 border-black shadow-sm bg-white">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Label htmlFor="urls" className="text-lg font-semibold mb-1 text-black">Enter blog URLs</Label>
            <span className="text-sm text-gray-800 italic mb-2">One per line or comma-separated. Example: https://example.com/blog1</span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center gap-2 bg-white rounded-xl p-2 shadow-inner border border-gray-200">
                <Textarea
                  ref={textareaRef}
                  id="urls"
                  value={urls}
                  onChange={e => setUrls(e.target.value)}
                  rows={2}
                  className="textarea flex-1 min-h-[48px] max-h-32 border-none bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-0"
                  placeholder="https://example.com/blog1, https://example.com/blog2"
                  required
                  disabled={loading}
                  aria-label="Blog URLs"
                />
                <Button type="submit" disabled={loading || !urls.trim()} className="h-12 px-6 bg-black text-white hover:bg-gray-900 font-semibold rounded-xl shadow">
                  <Search className="w-5 h-5 mr-2" />
                  Summarize
                </Button>
              </div>
            </div>
            <div className="flex flex-row gap-2 items-center mt-2">
              <Label htmlFor="language" className="text-black">Language:</Label>
              <Select value={language} onValueChange={v => setLanguage(v as 'english' | 'urdu')}>
                <SelectTrigger className="w-28 bg-white border border-gray-300 text-black">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="urdu">Urdu</SelectItem>
                </SelectContent>
              </Select>
              <Label className="ml-4 text-black">Processing:</Label>
              <Select value={useLLM ? 'llm' : 'logic'} onValueChange={v => setUseLLM(v === 'llm')}>
                <SelectTrigger className="w-32 bg-white border border-gray-300 text-black">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="logic">Logic-based</SelectItem>
                  <SelectItem value="llm">LLM (OpenAI)</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="secondary" onClick={loadHistory} className="ml-2 h-10 px-4 bg-white text-black border border-gray-300 hover:bg-gray-100">View History</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Results Section */}
      {loading && (
        <div className="w-full max-w-2xl mt-8">
          <Skeleton className="h-32 w-full rounded-xl mb-4" />
          <Skeleton className="h-32 w-full rounded-xl mb-4" />
        </div>
      )}
      {results.length > 0 && !loading && (
        <div className="w-full max-w-2xl mt-8 flex flex-col gap-6">
          {results.map((result, index) => (
            <Card key={index} className="shadow-sm rounded-xl border-black bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black truncate">{result.url}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {result.error ? (
                  <div className="text-red-600 font-medium">{result.error}</div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-semibold">Scraped Text:</span> {result.text.substring(0, 200)}...
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-black">{language === 'urdu' ? 'Urdu Summary:' : 'English Summary:'}</span>
                      {editingIndex === index ? (
                        <div className="mt-2 flex flex-col gap-2">
                          <Textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={3}
                            className="resize-none border rounded-md p-2 text-base bg-white text-black placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveEdit(index)} className="bg-black text-white hover:bg-gray-900">Save</Button>
                            <Button size="sm" variant="secondary" onClick={handleCancelEdit} className="bg-white text-black border border-gray-300 hover:bg-gray-100">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 mt-1">
                          <p className="text-base flex-1 bg-white rounded px-2 py-1 text-black">{language === 'urdu' ? result.urdu : result.summary}</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => speak(language === 'urdu' ? result.urdu : result.summary, language === 'urdu' ? 'ur-PK' : 'en-US')}
                            className="bg-white text-black border border-gray-300 hover:bg-gray-100"
                            aria-label="Listen to summary"
                            type="button"
                          >
                            <Volume2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={stopSpeaking}
                            className="bg-white text-black border border-gray-300 hover:bg-gray-100"
                            aria-label="Stop speech"
                            type="button"
                          >
                            Stop
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(index, language === 'urdu' ? result.urdu : result.summary)} className="bg-white text-black border border-gray-300 hover:bg-gray-100">Edit</Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row gap-4 items-center mt-2">
                      <span className="text-sm"><b>Sentiment:</b> <span className={
                        result.sentiment.classification === 'positive' ? 'text-green-600' :
                        result.sentiment.classification === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }>{result.sentiment.classification}</span></span>
                      <span className="text-sm text-gray-500">Score: {result.sentiment.score}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
          <Button onClick={exportToPDF} className="w-full mt-2 bg-black text-white font-semibold py-2 rounded-md hover:bg-gray-900">Export PDF</Button>
        </div>
      )}
      {/* History Section */}
      {showHistory && history.length > 0 && (
        <div className="w-full max-w-2xl mt-8 flex flex-col gap-6">
          <Card className="shadow-sm rounded-xl border-black bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-black">History</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => setShowHistory(false)} className="bg-white text-black border border-gray-300 hover:bg-gray-100">Hide</Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {history.map((item, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                  <div className="font-semibold text-black truncate">{item.url}</div>
                  <div className="text-xs text-gray-500 mb-1">Processed: {new Date(item.created_at).toLocaleString()}</div>
                  <div className="mb-1">
                    <span className="font-semibold text-black">{language === 'urdu' ? 'Urdu Summary:' : 'English Summary:'}</span>
                    <div className="text-base bg-white rounded px-2 py-1 mt-1 text-black">{language === 'urdu' ? item.urdu_translation : item.summary}</div>
                  </div>
                  <div className="flex flex-row gap-4 items-center mt-1">
                    <span className="text-sm"><b>Sentiment:</b> <span className={
                      item.sentiment_classification === 'positive' ? 'text-green-600' :
                      item.sentiment_classification === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }>{item.sentiment_classification}</span></span>
                    <span className="text-sm text-gray-500">Score: {item.sentiment_score}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
      <Toaster />
    </div>
  );
}
