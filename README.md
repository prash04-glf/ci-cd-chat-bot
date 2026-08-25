# Gemma Chat

A frontend-only React chat interface for Google AI Studio's `gemma-4-31b-it` model.

## Local setup

1. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_GEMINI_API_KEY` in `.env.local`.
4. Start the app with `npm run dev`.

The app uses the `generateContent` endpoint and sends the full conversation history with each message. `npm run build` creates a production bundle and `npm run lint` runs Oxlint.

If `VITE_GEMINI_API_KEY` is not available at build time, the app opens an API-key dialog when it loads. A key entered there is stored in that browser and can be updated from the `API key` control in the top bar. A build-time environment key takes precedence, so the dialog does not appear when `.env`, `.env.local`, or the deployment environment already supplies `VITE_GEMINI_API_KEY`.

## GitHub Pages

The `Deploy to GitHub Pages` workflow runs on pushes to `main`. Before the first deployment:

1. Add a repository secret named `VITE_GEMINI_API_KEY` under **Settings → Secrets and variables → Actions**.
2. Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

The Vite base path is derived from the GitHub repository name during the Actions build, so the app works at the project Pages URL.

## Security note

This intentionally sends the API request from the browser, so the key is exposed to anyone who can use the deployed app. That is suitable for a local prototype or trusted internal demo. A public production deployment should put a server-side proxy between the browser and Google AI Studio.
