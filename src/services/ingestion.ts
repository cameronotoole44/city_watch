import sql from "../db";
import * as twitchService from "./twitch";
import * as kickService from "./kick";

interface Streamer {
  id: number;
  name: string;
  twitch_username: string;
  kick_username: string;
  characters: string[];
}

async function fetchAndStore(): Promise<void> {
  const streamers = await sql<Streamer[]>`
        SELECT id, name, twitch_username, kick_username, characters
        FROM streamers
    `;

  const dbStreamers = streamers.map((s) => ({
    name: s.name,
    twitchUsername: s.twitch_username,
    kickUsername: s.kick_username,
    characters: s.characters,
  }));

  const [twitchResults, kickResults] = await Promise.all([
    twitchService.getLiveStreams(dbStreamers),
    kickService.getLiveStreams(dbStreamers),
  ]);

  const snapshots = streamers.map((streamer) => {
    const twitch = twitchResults.find((s) => s.name === streamer.name);
    const kick = kickResults.find((s) => s.name === streamer.name);
    const twitchLive = twitch?.isLive ?? false;
    const kickLive = kick?.isLive ?? false;
    const isLive = twitchLive || kickLive;

    let platform: string | null = null;
    if (twitchLive && kickLive) platform = "both";
    else if (twitchLive) platform = "twitch";
    else if (kickLive) platform = "kick";

    const primary = kickLive ? kick : twitch;

    return {
      streamer_id: streamer.id,
      is_live: isLive,
      platform,
      twitch_live: twitchLive,
      kick_live: kickLive,
      viewer_count: isLive ? (primary?.viewerCount ?? null) : null,
      title: isLive ? (primary?.title ?? null) : null,
      category: isLive ? (primary?.category ?? null) : null,
      started_at: isLive ? (primary?.startedAt ?? null) : null,
      thumbnail_url: isLive ? (twitch?.thumbnailUrl ?? null) : null,
      twitch_title: twitchLive ? (twitch?.title ?? null) : null,
      twitch_viewer_count: twitchLive ? (twitch?.viewerCount ?? null) : null,
      twitch_started_at: twitchLive ? (twitch?.startedAt ?? null) : null,
      twitch_category: twitchLive ? (twitch?.category ?? null) : null,
      kick_title: kickLive ? (kick?.title ?? null) : null,
      kick_viewer_count: kickLive ? (kick?.viewerCount ?? null) : null,
      kick_started_at: kickLive ? (kick?.startedAt ?? null) : null,
      kick_category: kickLive ? (kick?.category ?? null) : null,
    };
  });

  await sql`
        INSERT INTO stream_snapshots ${sql(snapshots)}
    `;

  const liveCount = snapshots.filter((s) => s.is_live).length;
  const gtaCount = snapshots.filter(
    (s) => s.category === "Grand Theft Auto V",
  ).length;
  console.log(
    `[ingestion] ${liveCount} live, ${gtaCount} in city, ${streamers.length} total`,
  );
}

let polling = false;
const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function startIngestion(): void {
  if (polling) return;
  polling = true;

  console.log("[ingestion] starting...");
  fetchAndStore().catch((err) =>
    console.error("[ingestion] initial fetch failed:", err),
  );

  setInterval(() => {
    fetchAndStore().catch((err) =>
      console.error("[ingestion] poll failed:", err),
    );
  }, POLL_INTERVAL_MS);
}
