# city_watch

real-time stream tracker for NoPixel whitelisted players across Twitch and Kick.

answers the question: is [character] in the city right now?

## **live**: https://citywatch-production.up.railway.app/

## architecture

```
Twitch API + Kick API
        ↓
ingestion service (polls every 5 min)
        ↓
PostgreSQL (streamers + stream_snapshots)
        ↓
REST API (Bun + TypeScript)
        ↓
frontend (HTML/CSS/JS)
```

a background ingestion service polls both platforms on a schedule and writes
snapshots to postgres. the api reads from the db. upstream apis are never
hit per request. this means the api stays fast and snapshot history is
preserved for future analytics.

---

## stack

- **runtime**: Bun
- **language**: TypeScript
- **database**: PostgreSQL
- **apis**: Twitch Helix API, Kick v2 API
- **frontend**: HTML, CSS, JavaScript

---

## features

- live stream detection across Twitch and Kick simultaneously
- dual-stream support, toggle between platforms per streamer
- GTA V category filtering (in city / not in city)
- search by character name or streamer name
- viewer count and stream uptime
- offline streamer list
- snapshot history stored in postgres

---

## screenshot

![city_watch screenshot](/public/assets/v0.5.0-ui.png)

## project structure

```
city_watch/
├── database/
│   ├── schema.sql             # table definitions
│   └── seed.ts                # populates streamers table from json
├── functions/
│   └── api/
│       └── streams.ts         # api handler, reads from db
├── scripts/
│   └── convert-characters.ts  # one-time migration, normalizes characters field
├── src/
│   ├── db.ts                  # postgres connection client
│   ├── data/
│   │   └── streamers.json
│   ├── services/
│   │   ├── ingestion.ts       # polls apis, writes snapshots to db
│   │   ├── twitch.ts          # twitch helix api client
│   │   └── kick.ts            # kick v2 api client
│   └── types/
│       └── streamer.ts
├── public/
│   ├── index.html
│   └── styles.css
└── server.ts                  # bun http server
```

---

## getting started

### prerequisites

- Bun
- PostgreSQL
- Twitch developer app (client id + secret)

### setup

```bash
git clone https://github.com/cameronotoole44/city_watch
cd city_watch
bun install
```

create a `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=city_watch
DB_USER=your_user
DB_PASSWORD=your_password
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
```

run the schema and seed:

```bash
psql -U your_user -d city_watch -f database/schema.sql
bun run database/seed.ts
```

start the server:

```bash
bun run server.ts
```

---

## database schema

### streamers

stores the static list of tracked streamers and their platform usernames.

### stream_snapshots

one row per poll per streamer. captures live status, viewer count, title,
category, and per-platform data for dual streamers. used to serve the api
and will power historical analytics.

---

## changelog

### 0.5.0

- postgres persistence replacing in-memory cache
- background ingestion service
- stream snapshot history
- per-platform data for dual streamers
- one-time character field migration

### 0.4.0

- category filtering for GTA V streams
- "not in city" section for live non-GTA streams
- collapsible sections with localStorage preference

### 0.3.0

- support for multiple characters per streamer
- collapsible offline channels section
- search bar added

### 0.2.0

- Kick integration
- dual streaming support
- caching

### 0.1.0

- initial Twitch support
- streamer cards
