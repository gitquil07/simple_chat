# MAX Chat on GREEN-API

A minimal web chat for the [MAX](https://max.ru) messenger, styled after web.max.ru and built on the
[GREEN-API MAX API](https://green-api.com/max). It sends and receives text messages only.

- **Login** with your instance `idInstance` and `apiTokenInstance` (checked with `getStateInstance`).
- **New chat**: enter a recipient phone number. The app resolves the MAX `chatId` with
  [`CheckAccount`](https://green-api.com/v3/docs/api/service/CheckAccount/) and falls back to `<phone>@c.us`.
- **Send** with [`SendMessage`](https://green-api.com/v3/docs/api/sending/SendMessage/).
- **Receive** with the [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/):
  a long-polling loop calls `ReceiveNotification`, handles the notification, then `DeleteNotification`.
  Incoming replies appear in their chat; messages from unknown senders open a new chat.
  Delivery and read ticks come from `outgoingMessageStatus` notifications.

Credentials and chat history are kept in the browser's `localStorage` only. All requests go straight
from the browser to `https://api.green-api.com/v3` (MAX instances, ids starting with `3100`) or to `https://<first 4 digits of idInstance>.api.greenapi.com` for other instances. The apiUrl from the console can also be entered on the login screen.

## Requirements

- Node.js 20.19+ (or 22.12+)
- A GREEN-API **MAX** instance in the *authorized* state
- Incoming notifications enabled on the instance and **no webhook URL** set, so they are available
  via the HTTP API. In the [console](https://console.green-api.com) set `webhookUrl` empty and turn on
  `incomingWebhook`, `outgoingWebhook` and `outgoingMessageStatus` (or call
  [`SetSettings`](https://green-api.com/v3/docs/api/account/SetSettings/)).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173, sign in, press **+** and enter a phone number such as `79991234567`.

Other scripts:

```bash
npm run build     # type-check and build to dist/
npm run preview   # serve the production build
npm run lint      # oxlint
```

## Deploy

The build is a static site with relative asset paths (`base: './'`), so `dist/` works from any host or sub-path.

- **Vercel / Netlify**: import the repository. Framework preset *Vite*, build command `npm run build`,
  output directory `dist`.
- **GitHub Pages**: push to `main` and set *Settings → Pages → Source* to *GitHub Actions*.
  The workflow in `.github/workflows/deploy.yml` builds and publishes the site.

## Project structure

```
src/
  api/greenApi.ts                  GREEN-API MAX REST calls
  hooks/useNotificationPolling.ts  ReceiveNotification / DeleteNotification loop
  store/chats.ts                   chat state reducer, notification handling, persistence
  components/                      LoginScreen, Sidebar (chat list + new chat), ChatView
  App.tsx                          login gate and messenger layout
```
