const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Initialize Clients
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('yoga-gemini'); // Ensure Index Dimension is 768 on Pinecone Dashboard
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

const data = JSON.parse(fs.readFileSync('../data/yoga_knowledge.json', 'utf8'));

async function run() {
  console.log("Starting ingestion...");
  
  for (const article of data) {
    const textToEmbed = `Title: ${article.title}. Content: ${article.content}. Safety: ${article.safety_notes}`;
    
    // Generate Embedding using Gemini
    const result = await model.embedContent(textToEmbed);
    const vector = result.embedding.values;

    await index.upsert([{
      id: article.id,
      values: vector,
      metadata: {
        title: article.title,
        text: article.content,
        safety: article.safety_notes
      }
    }]);
    console.log(`✅ Uploaded: ${article.title}`);
  }
}
run();