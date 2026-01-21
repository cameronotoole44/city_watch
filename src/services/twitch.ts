import { Streamer, StreamStatus } from "../types/streamer";

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchStream {
  user_login: string;
  user_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
}

interface TwitchStreamsResponse {
  data: TwitchStream[];
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
  }

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Twitch token: ${response.status}`);
  }

  const data: TwitchTokenResponse = await response.json();

  cachedToken = data.access_token;
  // 5 minute expire
  tokenExpiry = now + (data.expires_in - 300) * 1000;

  return cachedToken;
}

export async function getLiveStreams(
  streamers: Streamer[],
): Promise<StreamStatus[]> {
  const twitchUsernames = streamers
    .filter((s) => s.twitchUsername)
    .map((s) => s.twitchUsername!.toLowerCase());

  if (twitchUsernames.length === 0) {
    return streamers.map((s) => ({ ...s, isLive: false }));
  }

  const token = await getAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID!;

  // max 100 user_login params per request
  const BATCH_SIZE = 100;
  const liveMap = new Map<string, TwitchStream>();

  for (let i = 0; i < twitchUsernames.length; i += BATCH_SIZE) {
    const batch = twitchUsernames.slice(i, i + BATCH_SIZE);
    const params = new URLSearchParams();
    batch.forEach((username) => params.append("user_login", username));

    console.log(
      `[Twitch] Fetching batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} users)`,
    );

    const response = await fetch(
      `https://api.twitch.tv/helix/streams?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": clientId,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch streams: ${response.status}`);
    }

    const data: TwitchStreamsResponse = await response.json();

    for (const stream of data.data) {
      liveMap.set(stream.user_login.toLowerCase(), stream);
    }
  }

  console.log(`[Twitch] Found ${liveMap.size} live streams`);

  return streamers.map((streamer) => {
    const twitchUsername = streamer.twitchUsername?.toLowerCase();
    const liveStream = twitchUsername ? liveMap.get(twitchUsername) : undefined;

    if (liveStream) {
      return {
        ...streamer,
        isLive: true,
        platform: "twitch" as const,
        title: liveStream.title,
        viewerCount: liveStream.viewer_count,
        thumbnailUrl: liveStream.thumbnail_url,
        startedAt: liveStream.started_at,
      };
    }

    return {
      ...streamer,
      isLive: false,
    };
  });
}
