import sql from "../src/db";
import streamersData from "../src/data/streamers.json";

interface Streamer {
  name: string;
  twitchUsername: string;
  kickUsername: string;
  characters: string[];
}

const streamers: Streamer[] = streamersData;

async function seed() {
  console.log(`seeding ${streamers.length} streamers...`);

  for (const streamer of streamers) {
    const characters = `{${streamer.characters.map((c) => `"${c}"`).join(",")}}`;
    await sql`
        INSERT INTO streamers (name, twitch_username, kick_username, characters)
        VALUES (
            ${streamer.name},
            ${streamer.twitchUsername},
            ${streamer.kickUsername},
            ${characters}::text[]
        )
        ON CONFLICT (name) DO UPDATE SET
            twitch_username = EXCLUDED.twitch_username,
            kick_username = EXCLUDED.kick_username,
            characters = EXCLUDED.characters
    `;
  }

  console.log("done");
  await sql.end();
}

seed().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
