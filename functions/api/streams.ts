import { Streamer, StreamStatus } from "../../src/types/streamer";
import * as twitchService from "../../src/services/twitch";
import * as kickService from "../../src/services/kick";
import streamersData from "../../src/data/streamers.json";

const streamers: Streamer[] = streamersData;

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedResults: StreamStatus[] | null = null;
let lastFetchTime: number = 0;

async function fetchFreshData(): Promise<StreamStatus[]> {
  const [twitchResults, kickResults] = await Promise.all([
    twitchService.getLiveStreams(streamers),
    kickService.getLiveStreams(streamers),
  ]);
  const mergedResults: StreamStatus[] = streamers.map((streamer) => {
    const twitchStatus = twitchResults.find((s) => s.name === streamer.name);
    const kickStatus = kickResults.find((s) => s.name === streamer.name);
    const twitchLive = twitchStatus?.isLive || false;
    const kickLive = kickStatus?.isLive || false;

    if (twitchLive && kickLive) {
      return {
        ...streamer,
        isLive: true,
        platform: "both" as const,
        title:
          (kickStatus!.viewerCount || 0) >= (twitchStatus!.viewerCount || 0)
            ? kickStatus!.title
            : twitchStatus!.title,
        viewerCount: Math.max(
          kickStatus!.viewerCount || 0,
          twitchStatus!.viewerCount || 0,
        ),
        thumbnailUrl: twitchStatus!.thumbnailUrl,
        startedAt: twitchStatus!.startedAt,
        category:
          (kickStatus!.viewerCount || 0) >= (twitchStatus!.viewerCount || 0)
            ? kickStatus!.category
            : twitchStatus!.category,
        twitch: {
          isLive: true,
          title: twitchStatus!.title,
          viewerCount: twitchStatus!.viewerCount,
          thumbnailUrl: twitchStatus!.thumbnailUrl,
          startedAt: twitchStatus!.startedAt,
          category: twitchStatus!.category,
        },
        kick: {
          isLive: true,
          title: kickStatus!.title,
          viewerCount: kickStatus!.viewerCount,
          thumbnailUrl: kickStatus!.thumbnailUrl,
          startedAt: kickStatus!.startedAt,
          category: kickStatus!.category,
        },
      };
    }
    if (kickLive) {
      return {
        ...kickStatus!,
        kick: {
          isLive: true,
          title: kickStatus!.title,
          viewerCount: kickStatus!.viewerCount,
          thumbnailUrl: kickStatus!.thumbnailUrl,
          startedAt: kickStatus!.startedAt,
          category: kickStatus!.category,
        },
      };
    }
    if (twitchLive) {
      return {
        ...twitchStatus!,
        twitch: {
          isLive: true,
          title: twitchStatus!.title,
          viewerCount: twitchStatus!.viewerCount,
          thumbnailUrl: twitchStatus!.thumbnailUrl,
          startedAt: twitchStatus!.startedAt,
          category: twitchStatus!.category,
        },
      };
    }
    return {
      ...streamer,
      isLive: false,
    };
  });
  return mergedResults.sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    if (a.isLive && b.isLive) {
      return (b.viewerCount || 0) - (a.viewerCount || 0);
    }
    return 0;
  });
}

export async function getStreams(): Promise<StreamStatus[]> {
  const now = Date.now();

  if (cachedResults && now - lastFetchTime < CACHE_TTL_MS) {
    console.log("[cache] serving cached results");
    return cachedResults;
  }
  try {
    console.log("[cache] fetching fresh data...");
    cachedResults = await fetchFreshData();
    lastFetchTime = now;
    const liveCount = cachedResults.filter((s) => s.isLive).length;
    const dualCount = cachedResults.filter((s) => s.platform === "both").length;
    const gtaCount = cachedResults.filter(
      (s) => s.isLive && s.category === "Grand Theft Auto V",
    ).length;
    console.log(
      `[cache] cached ${cachedResults.length} streamers, ${liveCount} live, ${gtaCount} in city, ${dualCount} dual-streaming`,
    );
    return cachedResults;
  } catch (error) {
    console.error("error fetching streams:", error);
    if (cachedResults) {
      console.log("[cache] returning stale cache due to error");
      return cachedResults;
    }
    throw error;
  }
}
