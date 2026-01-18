export interface Streamer {
  name: string;
  twitchUsername?: string;
  kickUsername?: string;
  character?: string;
}

export interface StreamStatus extends Streamer {
  isLive: boolean;
  platform?: "twitch" | "kick";
  title?: string;
  viewerCount?: number;
  thumbnailUrl?: string;
  startedAt?: string;
}
