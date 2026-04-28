# MediBridge 🏥🤖

A Google Solution Challenge 2026 (Build with AI - India) prototype.
MediBridge helps users decode complex medical lab reports, manage emergency info, and estimate insurance claims in plain language, powered by Google Gemini AI.

## Features

1. **AI Medical Report Assistant**: Paste raw text OR upload a photo/PDF of your lab report to get plain-language summaries, key findings, and extracted metrics using Gemini.
2. **Health Trend Tracking**: Automatically plot extracted metrics (e.g., Hemoglobin over time) in simple line charts.
3. **AI Health Predictions**: Analyze your full health history to generate a personalized risk assessment, trend analysis, and lifestyle recommendations.
4. **Emergency QR Card**: Generate a public QR code linking to your vital details (blood group, allergies, emergency contact) for first responders.
5. **Insurance Claim Estimator**: Paste your policy wording and a hospital bill to get an AI-estimated coverage breakdown.
6. **Document Storage**: All uploaded PDFs and images are securely stored in Firebase Storage, permanently linked to your report.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Cloud Firestore
- **File Storage**: Firebase Storage (PDFs & Images)
- **Auth**: Firebase Authentication (Email/Password)
- **AI**: Google Gemini API (latest flash model)
- **Charts**: Recharts
- **Deployment target**: Vercel or Firebase Hosting

---

## Local Setup Instructions

### 1. Prerequisites
- Node.js v20+ installed
- A Firebase project
- A Google Gemini API Key

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication** → Email/Password provider.
3. Enable **Firestore Database** (start in test mode, or apply the rules in `firestore.rules`).
4. Enable **Firebase Storage**:
   - In the Firebase Console, go to **Build → Storage**.
   - Click **Get Started** and choose a region close to India (e.g., `asia-south1`).
   - Apply the following Storage security rules in the **Rules** tab:
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /reports/{userId}/{allPaths=**} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
5. Generate a **Service Account Key** for the Admin SDK (Project Settings → Service Accounts → Generate new private key). Download the JSON file.

### 3. Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in `.env.local` with your credentials:
   - `NEXT_PUBLIC_FIREBASE_*`: Get these from your Firebase Project Settings > General > Web App.
   - `FIREBASE_ADMIN_*`: Get these from the Service Account JSON file you downloaded. **Make sure to copy the `private_key` exactly, preserving the `\n` characters.**
   - `GEMINI_API_KEY`: Get this from [Google AI Studio](https://aistudio.google.com/).

### 4. Run the Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment (Vercel)

1. Push your code to a GitHub repository.
2. Create a new project in Vercel and import your repository.
3. In the Vercel dashboard, go to **Settings → Environment Variables**.
4. Add ALL the variables from your `.env.local` file.
   - *Note for `FIREBASE_ADMIN_PRIVATE_KEY`*: Wrap the entire key in double quotes in Vercel's UI.
5. Deploy!

---

## Firebase Setup (Indexes + Rules via CLI)

The app uses compound Firestore queries that require composite indexes. The easiest way to set these up is via the **Firebase CLI**.

### One-time Setup
```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your Firebase project
```

### Deploy Indexes + Rules
```bash
firebase deploy --only firestore
firebase deploy --only storage
```

This will apply:
- `firestore.rules` – Firestore security rules
- `firestore.indexes.json` – All required composite indexes
- `storage.rules` – Firebase Storage security rules

> **Alternative**: If you don't want to use the CLI, each query error in the server logs will include a direct **Firebase Console link** to create that specific index with one click.

---

## Project Structure

- `src/app`: Next.js App Router pages and API routes.
  - `api/analyze-report`: Gemini AI report analysis endpoint.
  - `api/estimate-claim`: Gemini AI insurance claim estimator endpoint.
  - `api/predict-health`: Gemini AI health prediction endpoint.
  - `(app)/reports`: Lab report list, new report form, and detail view.
  - `(app)/predictions`: AI Health Predictions dashboard.
  - `(app)/insurance`: Insurance policy management and claim estimator.
  - `(app)/profile`: User profile and Emergency QR card generator.
  - `e/[slug]`: Public emergency card page (no auth required).
- `src/components`: Reusable UI components (layout, forms, charts).
- `src/lib`: Core utilities.
  - `firebase/clientApp.ts`: Firebase client (Auth, Firestore, Storage).
  - `firebase/adminApp.ts`: Firebase Admin SDK for server-side operations.
  - `geminiClient.ts`: Server-side Gemini API integration (report analysis, claim estimation, health prediction).
  - `firestoreHelpers.ts`: Typed database queries.
- `src/types`: Shared TypeScript interfaces for all Firestore collections.
- `src/config/env.ts`: Centralized, validated environment variable access.
- `firestore.rules`: Firestore security rules.
