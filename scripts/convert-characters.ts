const JSON_FILE = "./src/data/streamers.json";

interface OldStreamer {
  name: string;
  twitchUsername: string;
  kickUsername: string;
  character?: string;
  characters?: string | string[];
}

interface NewStreamer {
  name: string;
  twitchUsername: string;
  kickUsername: string;
  characters: string[];
}

async function main() {
  const file = Bun.file(JSON_FILE);
  const streamers: OldStreamer[] = await file.json();
  const converted: NewStreamer[] = streamers.map((s) => {
    let characters: string[] = [];

    if (s.character && s.character.length > 0) {
      characters = [s.character];
    } else if (typeof s.characters === "string" && s.characters.length > 0) {
      characters = [s.characters];
    } else if (Array.isArray(s.characters)) {
      characters = s.characters;
    }

    return {
      name: s.name,
      twitchUsername: s.twitchUsername,
      kickUsername: s.kickUsername,
      characters,
    };
  });

  await Bun.write(JSON_FILE, JSON.stringify(converted, null, 2) + "\n");
  console.log(` Converted ${converted.length} streamers`);
}

main();
