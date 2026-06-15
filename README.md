# US Trip Planner

A shared trip planning list for New York and Washington DC. Rate activities, add your own ideas, and share a link with your travel partner — changes sync automatically.

## Features

- **64 pre-loaded ideas** across NYC and Washington DC (sights, museums, activities, food)
- **5-star ratings** to prioritise what you both want to do
- **Add your own** places and activities
- **Share a link** — both people see updates within 5 seconds
- **Filter by category** and minimum rating to narrow down your shortlist

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

Click **"Share with Dad"** to copy the link. Send it to him — any ratings or additions either of you make will appear on both screens.

## Deploy online (so Dad can access from anywhere)

To share over the internet (not just your local network), deploy to [Render](https://render.com) (free tier):

1. Push this folder to a GitHub repo
2. Create a new **Web Service** on Render
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Share the Render URL with your dad

Each new visitor without a `?trip=` link gets a fresh list. Always share the full URL including `?trip=XXXXXXXX` so you both see the same list.

## How ratings work

- Tap stars to rate how much you want to do something (1 = not bothered, 5 = must do)
- Tap the same star again to clear the rating
- Filter by "4+ stars" to see your shared shortlist
- Cards with 4+ stars get a gold highlight

## Tech

- React + Vite frontend
- Express + SQLite backend
- Auto-refresh every 5 seconds for live sync
