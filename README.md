# Report Title: Wellness RAG Micro-App Development Report
## Project Name: YogiAI - "Ask Me Anything About Yoga"

---

## Slide 1: Project Overview & Objective

### Visual Title: Executive Summary

**Key Points:**
* **Goal:** Create a safe, AI-powered mobile assistant for Yoga practice.
* **Core Technology:** Retrieval-Augmented Generation (RAG).
* **Deliverable:** A fully functional Android Application (.apk).

**Detailed Report Text:**
This project aims to bridge the gap between static fitness knowledge and interactive AI coaching. We developed "YogiAI," a micro-app that allows users to ask natural language questions about yoga poses, benefits, and safety precautions. Unlike generic chatbots, YogiAI utilizes a RAG (Retrieval-Augmented Generation) pipeline to ground its answers in a curated dataset of verified yoga articles, ensuring accuracy and minimizing hallucinations. A critical focus was placed on User Safety, implementing strict logic to detect medical contraindications (e.g., pregnancy, injuries) and refuse risky advice.

---

## Slide 2: Technology Stack (The "What")

### Visual Title: Technical Architecture

**Key Components:**
* **Frontend:** React Native (via Expo Framework).
* **Backend:** Node.js with Express framework.
* **AI Engine:** Google Gemini 1.5 Flash (LLM) & Gemini text-embedding-004.
* **Databases:** Pinecone (Vector Storage) & MongoDB Atlas (Data Logging).
* **Infrastructure:** Render (Cloud Hosting) & Expo EAS (Mobile Build Service).

**Detailed Report Text:**
We selected a modern, scalable tech stack to ensure performance and cost-efficiency:
* **React Native (Expo):** Chosen for its ability to rapidly develop native mobile interfaces and generate installable APK files without complex Android Studio configurations.
* **Google Gemini API:** We utilized Gemini for both embedding generation (converting text to numbers) and chat completion. Gemini-1.5-flash was selected for its low latency and high token limit.
* **Pinecone:** A serverless vector database used to store the semantic meaning of our yoga knowledge base.
* **MongoDB:** A NoSQL database used to log every user interaction, safety flag, and AI response for future analysis.

---

## Slide 3: RAG Methodology (The "How It Works")

### Visual Title: The RAG Pipeline

**Process Flow:**
* **Ingestion:** Knowledge -> Vectors -> Database.
* **Retrieval:** Query -> Semantic Search -> Context.
* **Generation:** Context + Prompt -> AI Response.

**Detailed Report Text:**
The core intelligence of YogiAI follows a strict RAG methodology:
* **Data Ingestion:** We curated a dataset of yoga articles. A custom Node.js script utilized Google's text-embedding-004 model to convert these text articles into 768-dimensional vector embeddings, which were then indexed in Pinecone.
* **Semantic Retrieval:** When a user asks a question, the system converts their query into a vector in real-time. It queries Pinecone to find the "Top 3" most mathematically similar text chunks from our knowledge base.
* **Augmented Generation:** These retrieved chunks are injected into a strict "System Prompt." This prompt forces the Gemini AI to answer only using the provided facts, effectively preventing the AI from making up information.

---

## Slide 4: Safety & Guardrails Strategy

### Visual Title: Safety First Architecture

**Mechanisms:**
* **Keyword Heuristics:** Instant detection of high-risk terms.
* **System Prompt Engineering:** Persona restrictions.
* **Gemini Safety Settings:** Native harm blocks.

**Detailed Report Text:**
Given the physical nature of Yoga, safety was our non-negotiable priority. We implemented a multi-layered safety net:
* **Heuristic Layer:** A pre-processing filter scans incoming queries for keywords like "pregnancy," "hernia," "surgery," or "pain." If detected, the `isUnsafe` flag is triggered immediately.
* **Prompt Engineering:** The AI's persona is strictly defined as a "Yoga Therapist," not a doctor. It is instructed to output a "Consult a Physician" warning if the context implies medical risk.
* **UI Feedback:** The frontend listens for the `isUnsafe` flag. If true, the app creates a visual disruption—a red warning banner—and utilizes Text-to-Speech to audibly warn the user before reading the advice.

---

## Slide 5: Development Phase 1 - Backend & Logic

### Visual Title: Building the Core

**Activities:**
* Setting up Node.js Server.
* Integrating Google Gemini API.
* Connecting MongoDB & Pinecone.

**Detailed Report Text:**
The development began with the "Kitchen"—our Backend API. We initialized a Node.js project and created a secure server using Express. The primary challenge was integrating the Google Gemini SDK to handle both embeddings and chat simultaneously. We established a connection to MongoDB to log the "Triple Artifacts" of RAG: the User Query, the Retrieved Context (Sources), and the AI Response. This logging is crucial for auditing how the AI behaves over time.

---

## Slide 6: Development Phase 2 - Frontend & Experience

### Visual Title: Crafting the Experience

**Features:**
* Glassmorphism UI.
* Interactive Voice Features (TTS).
* Visual Feedback (Lottie Animations).

**Detailed Report Text:**
We moved beyond a basic chat interface to create a "Fabulous" user experience. Using React Native and Expo, we implemented:
* **Glassmorphism:** A translucent, modern card design using `expo-linear-gradient` to create a calming, premium aesthetic.
* **Accessibility:** We integrated `expo-speech`, allowing the app to read answers aloud. This is vital for yoga, as users cannot look at their screens while holding a pose.
* **Feedback Loops:** We replaced standard loading spinners with Lottie animations to keep the user engaged while the AI "thinks."

---

## Slide 7: Deployment & Delivery

### Visual Title: From Localhost to Production

**Steps:**
* **Backend:** Deployed to Render Cloud.
* **Mobile:** Built APK via Expo EAS.

**Detailed Report Text:**
To transition from a development prototype to a deliverable product:
* **Cloud Hosting:** We migrated the local Node.js server to Render.com. This required configuring the "Root Directory" settings to ensure the cloud build process could locate our `package.json` correctly.
* **APK Generation:** We utilized EAS (Expo Application Services) to compile the React Native JavaScript bundle into a native Android binary. By configuring `eas.json` with `buildType: "apk"`, we successfully generated a standalone installation file that runs independently of the development environment.

---

## Slide 8: Conclusion & Future Scope

### Visual Title: Project Impact

**Summary:**
* Successfully delivered a safe, functional RAG app.
* Zero-cost architecture (Free Tier usage).
* High-end UI with native performance.

**Detailed Report Text:**
The YogiAI project successfully demonstrates that high-quality, safe AI applications can be built using cost-effective tools like Google Gemini and React Native. The system effectively retrieves context, safeguards users against medical risks, and delivers information through a polished, native mobile interface. Future iterations could include video retrieval capabilities, user authentication for progress tracking, and voice-to-text input for a completely hands-free experience.
