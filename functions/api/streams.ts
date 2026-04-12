import sql from "../../src/db";

interface StreamerRow {
  id: number;
  name: string;
  twitch_username: string;
  kick_username: string;
  characters: string[];
}

interface SnapshotRow {
  streamer_id: number;
  is_live: boolean;
  platform: string | null;
  twitch_live: boolean;
  kick_live: boolean;
  viewer_count: number | null;
  title: string | null;
  category: string | null;
  started_at: string | null;
  captured_at: string;
  thumbnail_url: string | null;
  twitch_title: string | null;
  twitch_viewer_count: number | null;
  twitch_started_at: string | null;
  twitch_category: string | null;
  kick_title: string | null;
  kick_viewer_count: number | null;
  kick_started_at: string | null;
  kick_category: string | null;
}

export async function getStreams() {
  const streamers = await sql<StreamerRow[]>`
        SELECT id, name, twitch_username, kick_username, characters
        FROM streamers
        ORDER BY name
    `;

  const snapshots = await sql<SnapshotRow[]>`
    SELECT DISTINCT ON (streamer_id)
        streamer_id,
        is_live,
        platform,
        twitch_live,
        kick_live,
        viewer_count,
        title,
        category,
        started_at,
        captured_at,
        thumbnail_url,
        twitch_title,
        twitch_viewer_count,
        twitch_started_at,
        twitch_category,
        kick_title,
        kick_viewer_count,
        kick_started_at,
        kick_category
    FROM stream_snapshots
    ORDER BY streamer_id, captured_at DESC
`;

  const snapshotMap = new Map<number, SnapshotRow>();
  for (const snap of snapshots) {
    snapshotMap.set(snap.streamer_id, snap);
  }

  const results = streamers.map((streamer) => {
    const snap = snapshotMap.get(streamer.id);

    if (!snap || !snap.is_live) {
      return {
        name: streamer.name,
        twitchUsername: streamer.twitch_username,
        kickUsername: streamer.kick_username,
        characters: streamer.characters,
        isLive: false,
      };
    }

    return {
      name: streamer.name,
      twitchUsername: streamer.twitch_username,
      kickUsername: streamer.kick_username,
      characters: streamer.characters,
      isLive: true,
      platform: snap.platform,
      title: snap.title,
      viewerCount: snap.viewer_count,
      category: snap.category,
      startedAt: snap.started_at,
      thumbnailUrl: snap.thumbnail_url,
      capturedAt: snap.captured_at,
      twitch: snap.twitch_live
        ? {
            isLive: true,
            title: snap.twitch_title,
            viewerCount: snap.twitch_viewer_count,
            startedAt: snap.twitch_started_at,
            category: snap.twitch_category,
            thumbnailUrl: snap.thumbnail_url,
          }
        : undefined,
      kick: snap.kick_live
        ? {
            isLive: true,
            title: snap.kick_title,
            viewerCount: snap.kick_viewer_count,
            startedAt: snap.kick_started_at,
            category: snap.kick_category,
          }
        : undefined,
    };
  });

  return results.sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    if (a.isLive && b.isLive) {
      return (b.viewerCount ?? 0) - (a.viewerCount ?? 0);
    }
    return 0;
  });
}
