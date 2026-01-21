export interface Streamer {
  name: string;
  twitchUsername?: string;
  kickUsername?: string;
  character?: string;
}
export interface PlatformStatus {
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  thumbnailUrl?: string;
  startedAt?: string;
}
export interface StreamStatus extends Streamer {
  isLive: boolean;
  platform?: "twitch" | "kick" | "both";
  title?: string;
  viewerCount?: number;
  thumbnailUrl?: string;
  startedAt?: string;
  twitch?: PlatformStatus;
  kick?: PlatformStatus;
}
