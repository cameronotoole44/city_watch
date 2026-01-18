import { Streamer, StreamStatus } from "../../src/types/streamer";
import * as twitchService from "../../src/services/twitch";
import streamersData from "../../src/data/streamers.json";

const streamers: Streamer[] = streamersData;

export async function getStreams(): Promise<StreamStatus[]> {
  try {
    const results = await twitchService.getLiveStreams(streamers);

    return results.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      if (a.isLive && b.isLive) {
        return (b.viewerCount || 0) - (a.viewerCount || 0);
      }
      return 0;
    });
  } catch (error) {
    console.error("Error fetching streams:", error);
    throw error;
  }
}
