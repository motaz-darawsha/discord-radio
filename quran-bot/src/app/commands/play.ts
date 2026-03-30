import type { CommandData, ChatInputCommand, AutocompleteCommand } from "commandkit";
import { ApplicationCommandOptionType, GuildMember } from "discord.js";
import { searchSurahs, getSurahById } from "../../data/surahs.js";
import { searchReciters, getReciterById, DEFAULT_RECITER } from "../../data/reciters.js";
import { playerManager } from "../../services/player-manager.js";
import { playingEmbed, errorEmbed } from "../../services/embeds.js";

export const command: CommandData = {
  name: "play",
  description: "Play a Quran surah in your voice channel / تشغيل سورة من القرآن الكريم",
  options: [
    {
      name: "surah",
      description: "Surah name or number / اسم السورة أو رقمها",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: "reciter",
      description: "Choose a reciter / اختر القارئ",
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: true,
    },
    {
      name: "volume",
      description: "Volume level 0-100 / مستوى الصوت",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      min_value: 0,
      max_value: 100,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  if (!interaction.guild) {
    await interaction.reply({ embeds: [errorEmbed("This command can only be used in a server.")], ephemeral: true });
    return;
  }

  const member = interaction.member;
  if (!(member instanceof GuildMember)) {
    await interaction.reply({ embeds: [errorEmbed("Could not resolve guild member.")], ephemeral: true });
    return;
  }
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [errorEmbed("You must be in a voice channel to use this command.\nيجب أن تكون في قناة صوتية.")],
      ephemeral: true,
    });
    return;
  }

  const surahInput = interaction.options.getString("surah", true);
  const reciterInput = interaction.options.getString("reciter", false);
  const volume = interaction.options.getInteger("volume", false) ?? undefined;

  // Parse surah
  const surahId = parseInt(surahInput, 10);
  const surah = !isNaN(surahId) ? getSurahById(surahId) : undefined;

  if (!surah) {
    await interaction.reply({
      embeds: [errorEmbed(`Surah not found: **${surahInput}**\nUse autocomplete to select a valid surah.`)],
      ephemeral: true,
    });
    return;
  }

  // Parse reciter
  let reciter = DEFAULT_RECITER;
  if (reciterInput) {
    const reciterId = parseInt(reciterInput, 10);
    const found = !isNaN(reciterId) ? getReciterById(reciterId) : undefined;
    if (found) {
      reciter = found;
    }
  }

  // Check if reciter has this surah
  if (!reciter.surahList.includes(surah.id)) {
    await interaction.reply({
      embeds: [errorEmbed(`The reciter **${reciter.name}** does not have surah **${surah.name}** available.`)],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    await playerManager.play(interaction.guild.id, voiceChannel, surah, reciter, volume);

    const state = playerManager.get(interaction.guild.id);
    const currentVolume = state?.player.volume ?? volume ?? 100;

    await interaction.editReply({
      embeds: [playingEmbed(surah, reciter, currentVolume)],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred.";
    await interaction.editReply({
      embeds: [errorEmbed(`Failed to play: ${message}`)],
    });
  }
};

export const autocomplete: AutocompleteCommand = async ({ interaction }) => {
  const focused = interaction.options.getFocused(true);

  if (focused.name === "surah") {
    const results = searchSurahs(focused.value, 25);
    await interaction.respond(
      results.map((s) => ({
        name: `${s.id}. ${s.name} - ${s.englishName}`,
        value: s.id.toString(),
      })),
    );
  }

  if (focused.name === "reciter") {
    const results = searchReciters(focused.value, 25);
    await interaction.respond(
      results.map((r) => ({
        name: `${r.name} - ${r.englishName}`,
        value: r.id.toString(),
      })),
    );
  }
};
