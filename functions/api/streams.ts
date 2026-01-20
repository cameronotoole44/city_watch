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

    if (kickStatus?.isLive) {
      return kickStatus;
    }
    if (twitchStatus?.isLive) {
      return twitchStatus;
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
    console.log(
      `[cache] cached ${cachedResults.length} streamers, ${cachedResults.filter((s) => s.isLive).length} live`,
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
