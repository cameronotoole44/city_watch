import { Streamer, StreamStatus } from "../types/streamer";

interface KickV2Channel {
  id: number;
  user_id: number;
  slug: string;
  is_banned: boolean;
  playback_url: string;
  livestream: {
    id: number;
    slug: string;
    session_title: string;
    created_at: string;
    is_live: boolean;
    viewer_count: number;
    thumbnail: {
      url: string;
    };
  } | null;
  user: {
    username: string;
    profile_pic: string;
  };
}

async function getChannelInfo(slug: string): Promise<KickV2Channel | null> {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${slug}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `[Kick] failed to fetch channel ${slug}: ${response.status}`,
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[Kick] error fetching channel ${slug}:`, error);
    return null;
  }
}

export async function getLiveStreams(
  streamers: Streamer[],
): Promise<StreamStatus[]> {
  const kickStreamers = streamers.filter((s) => s.kickUsername);

  if (kickStreamers.length === 0) {
    return streamers.map((s) => ({ ...s, isLive: false }));
  }

  try {
    const batchSize = 10;
    const results: (KickV2Channel | null)[] = [];

    for (let i = 0; i < kickStreamers.length; i += batchSize) {
      const batch = kickStreamers.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((s) => getChannelInfo(s.kickUsername!.toLowerCase())),
      );
      results.push(...batchResults);

      if (i + batchSize < kickStreamers.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const channelMap = new Map<string, KickV2Channel>();
    results.forEach((channel) => {
      if (channel) {
        channelMap.set(channel.slug.toLowerCase(), channel);
      }
    });

    console.log(`[Kick] fetched ${channelMap.size} channels`);

    return streamers.map((streamer) => {
      const kickUsername = streamer.kickUsername?.toLowerCase();
      const channel = kickUsername ? channelMap.get(kickUsername) : undefined;

      if (channel?.livestream?.is_live) {
        console.log(
          `[Kick] ${streamer.name} is LIVE with ${channel.livestream.viewer_count} viewers`,
        );
        return {
          ...streamer,
          isLive: true,
          platform: "kick" as const,
          title: channel.livestream.session_title,
          viewerCount: channel.livestream.viewer_count,
          thumbnailUrl: undefined,
          startedAt: channel.livestream.created_at,
        };
      }
      return {
        ...streamer,
        isLive: false,
      };
    });
  } catch (error) {
    console.error("[Kick] error fetching streams:", error);
    return streamers.map((s) => ({ ...s, isLive: false }));
  }
}
