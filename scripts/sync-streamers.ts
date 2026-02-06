import * as readline from "readline";

const LIST_FILE = "./list.txt";
const JSON_FILE = "./src/data/streamers.json";

interface Streamer {
  name: string;
  twitchUsername: string;
  kickUsername: string;
  character: string;
}

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

async function main() {
  const listFile = Bun.file(LIST_FILE);
  if (!(await listFile.exists())) {
    console.error(`error: ${LIST_FILE} not found`);
    process.exit(1);
  }

  const listContent = await listFile.text();
  const listUsernames = listContent
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0);

  const uniqueUsernames = [...new Set(listUsernames)].sort((a, b) =>
    a.localeCompare(b),
  );
  const listChanged =
    uniqueUsernames.length !== listUsernames.length ||
    uniqueUsernames.join("\n") !== listUsernames.join("\n");
  if (listChanged) {
    const dupeCount = listUsernames.length - uniqueUsernames.length;
    if (dupeCount > 0) {
      console.log(`removed ${dupeCount} duplicate(s) from list.txt`);
    }
    await Bun.write(LIST_FILE, uniqueUsernames.join("\n") + "\n");
    console.log(`sorted list.txt (${uniqueUsernames.length} entries)`);
  }

  const jsonFile = Bun.file(JSON_FILE);
  let existingStreamers: Streamer[] = [];
  if (await jsonFile.exists()) {
    existingStreamers = await jsonFile.json();
  }

  const existingMap = new Map<string, Streamer>();
  for (const streamer of existingStreamers) {
    existingMap.set(streamer.name.toLowerCase(), streamer);
  }

  const existingNames = new Set(
    existingStreamers.map((s) => s.name.toLowerCase()),
  );
  const listSet = new Set(uniqueUsernames);
  const newUsernames = uniqueUsernames.filter((u) => !existingNames.has(u));
  const removedUsernames = [...existingNames].filter((u) => !listSet.has(u));

  console.log(`\nlist.txt: ${uniqueUsernames.length} usernames`);
  console.log(`streamers.json: ${existingStreamers.length} entries`);

  if (newUsernames.length > 0) {
    console.log(`\n new streamers to add (${newUsernames.length}):`);
    newUsernames.forEach((u) => console.log(`   + ${u}`));
  }
  if (removedUsernames.length > 0) {
    console.log(
      `\n  streamers in JSON but not in list (${removedUsernames.length}):`,
    );
    removedUsernames.forEach((u) => {
      const streamer = existingMap.get(u);
      const hasData = streamer?.character && streamer.character.length > 0;
      console.log(
        `   - ${u}${hasData ? ` (has character: "${streamer?.character}")` : ""}`,
      );
    });
  }
  if (newUsernames.length === 0 && removedUsernames.length === 0) {
    console.log("\n already in sync!");
    return;
  }
  const newStreamers: Streamer[] = uniqueUsernames.map((username) => {
    const existing = existingMap.get(username);
    if (existing) {
      return existing;
    }
    return {
      name: username,
      twitchUsername: username,
      kickUsername: username,
      character: "",
    };
  });

  console.log("");
  const shouldWrite = await confirm("add changes to streamers.json?");
  if (shouldWrite) {
    await Bun.write(JSON_FILE, JSON.stringify(newStreamers, null, 2) + "\n");
    console.log(`\n updated ${JSON_FILE}`);
    console.log(`   total streamers: ${newStreamers.length}`);
    if (newUsernames.length > 0) {
      console.log(`   added: ${newUsernames.length}`);
    }
    if (removedUsernames.length > 0) {
      console.log(`   removed: ${removedUsernames.length}`);
    }
  } else {
    console.log("\nno changes made.");
  }
}
main();
