import { EmbedBuilder } from "discord.js";
import type { Surah } from "../data/surahs.js";
import type { Reciter } from "../data/reciters.js";

const QURAN_COLOR = 0x1b7a43;
const ERROR_COLOR = 0xe74c3c;
const INFO_COLOR = 0x3498db;
const WARN_COLOR = 0xf39c12;

export function playingEmbed(surah: Surah, reciter: Reciter, volume: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(QURAN_COLOR)
    .setTitle("--- Now Playing ---")
    .setDescription(`**${surah.name}** - ${surah.englishName}`)
    .addFields(
      { name: "Reciter / القارئ", value: `${reciter.name}\n${reciter.englishName}`, inline: true },
      { name: "Surah / السورة", value: `#${surah.id} - ${surah.verses} verses`, inline: true },
      { name: "Volume / الصوت", value: `${volume}%`, inline: true },
      { name: "Type / النوع", value: surah.type === "meccan" ? "مكية - Meccan" : "مدنية - Medinan", inline: true },
    )
    .setFooter({ text: "Quran Bot | mp3quran.net" })
    .setTimestamp();
}

export function stoppedEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(WARN_COLOR)
    .setTitle("--- Stopped ---")
    .setDescription("Playback stopped and left the voice channel.")
    .setFooter({ text: "Quran Bot" })
    .setTimestamp();
}

export function pausedEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(WARN_COLOR)
    .setTitle("--- Paused ---")
    .setDescription("Playback has been paused. Use `/resume` to continue.")
    .setFooter({ text: "Quran Bot" })
    .setTimestamp();
}

export function resumedEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(QURAN_COLOR)
    .setTitle("--- Resumed ---")
    .setDescription("Playback has been resumed.")
    .setFooter({ text: "Quran Bot" })
    .setTimestamp();
}

export function volumeEmbed(volume: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(INFO_COLOR)
    .setTitle("--- Volume ---")
    .setDescription(`Volume set to **${volume}%**`)
    .setFooter({ text: "Quran Bot" })
    .setTimestamp();
}

export function nowPlayingEmbed(surah: Surah, reciter: Reciter, volume: number, status: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(QURAN_COLOR)
    .setTitle("--- Now Playing ---")
    .setDescription(`**${surah.name}** - ${surah.englishName}`)
    .addFields(
      { name: "Reciter / القارئ", value: `${reciter.name}\n${reciter.englishName}`, inline: true },
      { name: "Surah / السورة", value: `#${surah.id} - ${surah.verses} verses`, inline: true },
      { name: "Volume / الصوت", value: `${volume}%`, inline: true },
      { name: "Status / الحالة", value: status, inline: true },
    )
    .setFooter({ text: "Quran Bot | mp3quran.net" })
    .setTimestamp();
}

export function recitersListEmbed(reciters: Array<{ name: string; englishName: string; id: number }>, page: number, totalPages: number): EmbedBuilder {
  const list = reciters
    .map((r, i) => `**${(page - 1) * 10 + i + 1}.** ${r.name} - ${r.englishName}`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(INFO_COLOR)
    .setTitle("--- Available Reciters / القراء ---")
    .setDescription(list || "No reciters found.")
    .setFooter({ text: `Page ${page}/${totalPages} | Quran Bot` })
    .setTimestamp();
}

export function errorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(ERROR_COLOR)
    .setTitle("--- Error ---")
    .setDescription(message)
    .setFooter({ text: "Quran Bot" })
    .setTimestamp();
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(INFO_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "Quran Bot" })
    .setTimestamp();
}
