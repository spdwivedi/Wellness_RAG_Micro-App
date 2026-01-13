# 🌿 YogiAI - Wellness RAG Intelligence Platform

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Platform](https://img.shields.io/badge/Platform-Android-blue)
![Tech](https://img.shields.io/badge/Built%20With-React%20Native%20%7C%20Expo-61DAFB)

**YogiAI** is a specialized, voice-enabled AI micro-application acting as a personal wellness assistant. It uses **Retrieval-Augmented Generation (RAG)** to provide accurate, context-aware answers regarding yoga, mental health, and wellness routines, ensuring reliability over generic AI models.

---

## 📖 Table of Contents
- [Abstract](#abstract)
- [Problem Statement](#problem-statement)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Safety & Guardrails](#safety--guardrails)
- [Installation & Setup](#installation--setup)
- [How to Build (APK)](#how-to-build-apk)
- [Project Structure](#project-structure)
- [Challenges & Solutions](#challenges--solutions)

---

## 📝 Abstract
General-purpose AI often "hallucinates" when asked specific medical or wellness questions. YogiAI solves this by grounding its responses in a curated wellness knowledge base using **Google Gemini** and **Pinecone**. The app features a voice-first interface (`expo-av`), making it easy for users to ask questions hands-free during yoga sessions, while adhering to strict safety protocols to avoid providing dangerous medical advice.

---

## 🎯 Problem Statement
Users practicing yoga or meditation often need quick, reliable answers without scrolling through ads or reading long articles. Generic chatbots lack specific domain authority and safety checks. YogiAI bridges this gap by combining:
1.  **Voice Interaction** for hands-free use.
2.  **RAG Technology** for verified, trustworthy answers.
3.  **Safety First Logic** to detect contraindications (e.g., pregnancy, injuries).
4.  **Mobile-First Design** with adaptive iconography for modern Android devices.

---

## 🏗 System Architecture

The app follows a client-server model augmented by an AI processing layer:

1.  **User Input:** Voice/Text query captured by the Mobile App.
2.  **Heuristic Safety Check:** Immediate scan for high-risk keywords (e.g., "hernia", "surgery").
3.  **Vector Search:** Query converted to embeddings via **Gemini-004** -> Search **Pinecone** Knowledge Base.
4.  **LLM Generation:** Relevant docs + Query sent to **Gemini 1.5 Flash** for synthesis.
5.  **Response:** Final verified answer returned to user.



---

## 💻 Technology Stack

### **Frontend (Mobile)**
* **Framework:** React Native (Expo SDK 52)
* **Language:** TypeScript / JavaScript
* **Navigation:** Expo Router
* **Audio:** `expo-av` (Voice Input), `expo-speech` (TTS)
* **UI:** Glassmorphism with `expo-linear-gradient`
* **Native Config:** `expo-build-properties`

### **Backend & AI**
* **LLM:** Google Gemini 1.5 Flash
* **Embeddings:** Gemini text-embedding-004
* **Vector DB:** Pinecone
* **Logging:** MongoDB Atlas

### **DevOps & Build**
* **Build Tool:** Gradle 8.14.3
* **Environment:** OpenJDK 17 (Temurin)
* **Platform:** Android (APK)

---

## 🛡 Safety & Guardrails
Given the physical nature of Yoga, safety is non-negotiable.
* **Heuristic Layer:** Pre-processing filter scans for medical keywords.
* **Prompt Engineering:** The AI persona is restricted to a "Yoga Therapist" role and must refuse to give medical diagnoses.
* **UI Feedback:** Red warning banners and audio alerts trigger if unsafe topics are detected.

---

## 🚀 Installation & Setup

### Prerequisites
* **Node.js** (LTS version)
* **Java JDK 17** (Crucial: JDK 24 is not supported)
* **Android Studio SDK** (for local builds)

### 1. Clone the Repository
```bash
git clone [https://github.com/spdwivedi/Wellness_RAG_Micro-App.git](https://github.com/spdwivedi/Wellness_RAG_Micro-App.git)
cd Wellness_RAG_Micro-App
