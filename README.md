# Blog Summarizer with Urdu Translation

A comprehensive Next.js application that scrapes blog content, generates summaries, translates them to Urdu, performs sentiment analysis, and stores data in both Supabase and MongoDB.

## 🚀 Features

### Core Functionality
- **Web Scraping**: Extract full text content from blog URLs using Cheerio and Axios
- **Summary Generation**: Logic-based summarization using word frequency analysis OR LLM-based using OpenAI
- **Urdu Translation**: Dictionary-based English-to-Urdu translation OR LLM-based translation
- **Sentiment Analysis**: Analyze emotional tone using the sentiment library
- **Batch Processing**: Handle multiple URLs simultaneously
- **Processing Options**: Choose between logic-based and LLM-based processing

### Advanced Features
- **Editable Summaries**: Inline editing of generated summaries
- **PDF Export**: Export results to downloadable PDF reports
- **Language Switch**: Toggle between English and Urdu summaries
- **User History**: View and manage previously processed summaries
- **Dual Database Storage**: Supabase for summaries, MongoDB for full text

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Next.js API Routes
- **Web Scraping**: Cheerio, Axios
- **Translation**: Custom dictionary-based approach OR OpenAI LLM
- **Sentiment Analysis**: Sentiment library
- **PDF Generation**: jsPDF
- **Databases**: Supabase (PostgreSQL), MongoDB
- **Styling**: Tailwind CSS
- **LLM Integration**: OpenAI GPT-3.5-turbo

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- MongoDB database (local or cloud)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexium_abdullah_assignment-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   # Copy the example file
   cp env.example .env.local
   ```
   
   Then edit `.env.local` with your actual values:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string

   # OpenAI Configuration (Optional - for LLM features)
   OPENAI_API_KEY=your_openai_api_key
   ```

   **How to get your API keys and connection strings:**

   **Supabase:**
   1. Go to [supabase.com](https://supabase.com) and create a new project
   2. Go to Settings → API
   3. Copy the "Project URL" and "anon public" key

   **MongoDB:**
   1. For local MongoDB: Use `mongodb://localhost:27017/blog-summarizer`
   2. For MongoDB Atlas: Create a cluster and get the connection string from the "Connect" button

   **OpenAI (Optional):**
   1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
   2. Create an account and generate an API key
   3. Note: This is only needed if you want to use LLM-based processing

4. **Set up Supabase Database**
   - Create a new Supabase project
   - Create a table named `summaries` with the following schema:
   ```sql
   CREATE TABLE summaries (
     id SERIAL PRIMARY KEY,
     url TEXT NOT NULL,
     summary TEXT NOT NULL,
     urdu_translation TEXT,
     sentiment_score INTEGER DEFAULT 0,
     sentiment_classification TEXT DEFAULT 'neutral',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Set up MongoDB**
   - Create a MongoDB database (local or cloud)
   - The application will automatically create the `blogtexts` collection

## 🚀 Running the Application

1. **Development mode**
   ```bash
   npm run dev
   ```

2. **Build for production**
   ```bash
   npm run build
   npm start
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage

### Basic Workflow
1. **Choose Processing Method**: Select between "Logic-based" (free, dictionary-based) or "LLM (OpenAI)" (requires API key, more accurate)
2. **Enter URLs**: Input one or more blog URLs (separated by newlines or commas)
3. **Process**: Click "Summarize" to start the processing pipeline
4. **View Results**: See scraped text, summaries, translations, and sentiment analysis
5. **Edit**: Click "Edit" to modify summaries inline
6. **Export**: Click "Export PDF" to download results
7. **History**: Click "View History" to see previously processed URLs

### Processing Options
- **Logic-based**: Uses word frequency analysis for summarization and a dictionary for translation (free, works offline)
- **LLM (OpenAI)**: Uses GPT-3.5-turbo for both summarization and translation (requires OpenAI API key, more accurate and natural)

### Language Switching
- Use the language dropdown to switch between English and Urdu summaries
- The interface updates dynamically to show content in the selected language

### Advanced Features
- **Batch Processing**: Enter multiple URLs to process them all at once
- **Editable Summaries**: Click the "Edit" button to modify any summary
- **PDF Export**: Generate comprehensive PDF reports of all results
- **History Management**: View and access all previously processed content

## 🗄️ Database Schema

### Supabase (summaries table)
```sql
- id: SERIAL PRIMARY KEY
- url: TEXT (blog URL)
- summary: TEXT (English summary)
- urdu_translation: TEXT (Urdu translation)
- sentiment_score: INTEGER (sentiment score)
- sentiment_classification: TEXT (positive/negative/neutral)
- created_at: TIMESTAMP (processing timestamp)
```

### MongoDB (blogtexts collection)
```javascript
{
  url: String,
  text: String,
  timestamp: Date
}
```

## 🔌 API Endpoints

- `POST /api/scrape` - Scrape blog content from URLs
- `POST /api/summarize` - Generate summaries from text (logic-based)
- `POST /api/summarize-llm` - Generate summaries from text (LLM-based)
- `POST /api/translate` - Translate summaries to Urdu (dictionary-based)
- `POST /api/translate-llm` - Translate summaries to Urdu (LLM-based)
- `POST /api/sentiment` - Analyze sentiment of text
- `POST /api/store` - Store data in databases
- `GET /api/history` - Retrieve processing history

## 🎨 Customization

### Adding More Translation Words
Edit `src/app/api/translate/route.ts` to expand the English-to-Urdu dictionary:
```typescript
const dictionary: Record<string, string> = {
  "the": "دی",
  "and": "اور",
  // Add more words here
};
```

### Modifying Summary Algorithm
Edit `src/app/api/summarize/route.ts` to adjust the summarization logic:
- Change sentence scoring method
- Adjust the number of sentences in summary
- Modify word frequency weighting

### Styling
The application uses Tailwind CSS. Modify `src/app/globals.css` or component styles to customize the appearance.

## 🐛 Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure your Supabase and MongoDB configurations are correct
2. **Scraping Failures**: Some websites may block scraping; check the console for errors
3. **Translation Issues**: The dictionary-based approach may not translate all words
4. **Database Connection**: Verify your environment variables are set correctly

### Debug Mode
Enable debug logging by checking the browser console and server logs for detailed error information.

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub

---

**Built with ❤️ using Next.js, Supabase, and MongoDB**
