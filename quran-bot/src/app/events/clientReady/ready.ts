import type { EventHandler } from "commandkit";

const handler: EventHandler<"clientReady"> = (client) => {
  console.log(`[Quran Bot] ${client.user.displayName} is online!`);
  console.log(`[Quran Bot] Serving ${client.guilds.cache.size} guilds`);
};

export default handler;
