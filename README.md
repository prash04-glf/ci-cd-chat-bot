# Gemma Chat

A frontend-only React chat interface for Google AI Studio's `gemma-4-31b-it` model.

## Local setup

1. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_GEMINI_API_KEY` in `.env.local`.
4. Start the app with `npm run dev`.

The app uses the `generateContent` endpoint and sends the full conversation history with each message. `npm run build` creates a production bundle and `npm run lint` runs Oxlint.

## Security note

This intentionally sends the API request from the browser, so the key is exposed to anyone who can use the deployed app. That is suitable for a local prototype or trusted internal demo. A public production deployment should put a server-side proxy between the browser and Google AI Studio.
