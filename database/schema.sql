CREATE TABLE IF NOT EXISTS streamers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    twitch_username TEXT,
    kick_username TEXT,
    characters TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS stream_snapshots (
    id SERIAL PRIMARY KEY,
    streamer_id INTEGER REFERENCES streamers(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_live BOOLEAN NOT NULL DEFAULT FALSE,
    platform TEXT,
    twitch_live BOOLEAN DEFAULT FALSE,
    kick_live BOOLEAN DEFAULT FALSE,
    viewer_count INTEGER,
    title TEXT,
    category TEXT,
    started_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_snapshots_streamer_id ON stream_snapshots(streamer_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at ON stream_snapshots(captured_at);