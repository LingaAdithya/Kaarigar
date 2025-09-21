# Karigar Konnect

**Karigar Konnect** is an innovative e-commerce platform designed to empower Indian artisans by connecting them directly with a global customer base. The core mission is to bridge the digital divide for traditional craftspeople, enabling them to showcase and sell their unique handicrafts without requiring extensive technical knowledge.

The platform leverages cutting-edge AI to simplify the entire process, from creating a profile and listing a product to telling a compelling story that resonates with buyers.

## ✨ Core Features

The application is built around two primary user experiences: the **Artisan** and the **Customer**.

### 🎨 The Artisan's Journey (The Creator)

This journey is focused on making the online selling process as intuitive and accessible as possible, primarily through voice and AI assistance.

-   **Effortless Onboarding:** Artisans can create a professional profile by simply speaking their name and sharing their story. An AI flow enhances their raw, spoken story into a polished and engaging bio.
-   **AI-Powered Product Listing:** The "Add Your Masterpiece" workflow is the heart of the artisan experience:
    -   **Photo Upload:** Artisans can upload a single photo of their product or take one with their device's camera.
    -   **Voice-to-Listing:** Instead of typing, they can describe their product aloud. An AI flow analyzes their voice and the product photo to automatically and intelligently fill in the product's name, a rich description, materials, origin, and even a suggested price.
    -   **AI Photo Enhancement:** The platform can take a single uploaded photo and use AI to generate three new, professional-quality studio shots, giving customers a complete view of the product.
-   **Simple Dashboard:** Artisans have a clean home screen to view their published items and a straightforward page to track their orders.

### 🛍️ The Customer's Journey (The Buyer)

This journey is designed to be an immersive and delightful experience for discovering and connecting with authentic crafts.

-   **Rich Discovery:** The homepage welcomes customers with a visually striking "Artisan of the Day" feature, curated product collections, and the ability to explore crafts by region.
-   **"Dream It, Find It" AI Search:** Customers can move beyond simple keyword searches. They can describe the art they're dreaming of in their own words (e.g., "a wooden elephant statue with royal Rajasthani colors"), and an AI curator will analyze the request to find the best-matching product in the catalog.
-   **Immersive Product Pages:** Each product page features:
    -   A carousel of high-quality images.
    -   A compelling story about the product.
    -   A "Meet the Artisan" section where customers can *hear* the artisan's story in their own voice, translated into the customer's selected language.
-   **Multilingual Support:** The entire customer-facing experience can be translated into multiple languages (English, Hindi, Tamil, Bengali) with a single click.

---

## 🚀 Getting Started

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

-   Node.js (v18 or higher)
-   npm (or yarn/pnpm)
-   A Firebase project.

### 2. Configure Firebase

This project is configured to work with Firebase. You need to set up a Firebase project and get your configuration keys.

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Firestore and Storage:** In your new project, enable **Firestore** (in production mode) and **Firebase Storage**.
3.  **Get Web Config:** Go to Project Settings -> General -> Your apps -> Web. Register a new web app and copy the `firebaseConfig` object.
4.  **Update Config File:** Paste the copied config into `src/lib/firebase-config.ts`.

### 3. Environment Variables

Create a `.env.local` file in the root of the project and add your API keys.

```
# Get this from the Google Cloud Console for your Firebase project.
# Make sure the "Generative Language API" is enabled.
GEMINI_API_KEY="YOUR_GOOGLE_AI_API_KEY"
GEMINI_IMAGE_API_KEY="YOUR_GOOGLE_AI_API_KEY" # Can be the same as above

# Optional: For embedding maps on product pages
# Get this from the Google Cloud Console. Make sure "Maps Embed API" is enabled.
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
```

### 4. Install Dependencies

Install the required node modules using npm:

```bash
npm install
```

### 5. Seed the Database

The application includes a utility to populate your Firestore database with initial sample data for products, artisans, and regions.

Run the app and navigate to `http://localhost:9002/admin/seed-database` in your browser. Click the "Seed Database" button.

### 6. Run the Application

This project uses Genkit for its AI features, which runs as a separate process alongside the Next.js development server.

1.  **Start the Genkit Server** (in a new terminal):

    ```bash
    npm run genkit:dev
    ```

    This will start the AI flows and make them available for your Next.js app to call.

2.  **Start the Next.js App** (in another terminal):
    ```bash
    npm run dev
    ```

The application will now be running at `http://localhost:9002`.

---

## 💻 Technology Stack

-   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) (from Google AI)
-   **Backend:** [Firebase](https://firebase.google.com/) (Firestore & Storage)
-   **Form Management:** [React Hook Form](https://react-hook-form.com/)
-   **Schema Validation:** [Zod](https://zod.dev/)

---

## 📁 Project Structure

```
.
├── src
│   ├── ai                 # All Genkit AI flows and configuration
│   │   ├── flows          # Individual AI features (e.g., speech-to-text, story generation)
│   │   ├── dev.ts         # Entry point for the Genkit development server
│   │   └── genkit.ts      # Global Genkit AI client initialization
│   ├── app                # Next.js App Router
│   │   ├── artisan        # Routes and pages for the Artisan journey
│   │   ├── customer       # Routes and pages for the Customer journey
│   │   ├── admin          # Utility pages (e.g., database seeder)
│   │   ├── globals.css    # Global styles and ShadCN theme variables
│   │   └── layout.tsx     # Root layout
│   ├── components         # Reusable React components
│   │   ├── icons          # Custom SVG icon components
│   │   └── ui             # ShadCN UI components
│   ├── hooks              # Custom React hooks (e.g., useToast)
│   ├── lib                # Core libraries and utilities
│   │   ├── firebase.ts    # Firebase initialization
│   │   └── utils.ts       # Utility functions
│   └── services           # Backend data-fetching and mutation logic
│       ├── artisan-service.ts
│       └── customer-service.ts
├── firebase.json          # Firebase configuration
├── next.config.ts         # Next.js configuration
└── package.json           # Project dependencies
```