// Copy this file to `config.js` and fill in real values.
// `config.js` is gitignored so the bot token never lands in the repo.
//
// Deploying on GitHub Pages / Netlify / Vercel:
//   1. Create `config.js` locally (or upload it via the GitHub UI on the
//      deploy branch) with the real values from @BotFather and your group.
//   2. Reeve's contact form (see hero-shader.js) reads window.REEVE_CONFIG
//      at submit time and POSTs the brief to the Telegram Bot API.
//
// Security note: on a static site this token is visible to any visitor
// who opens DevTools. For production, put the sendMessage call behind a
// tiny serverless proxy (Cloudflare Worker / Vercel Function) that keeps
// the token server-side, and rotate the token via @BotFather → /revoke.

window.REEVE_CONFIG = {
  TG_BOT_TOKEN: 'PASTE_BOT_TOKEN_HERE',
  TG_CHAT_ID: '-100XXXXXXXXXX',
};
