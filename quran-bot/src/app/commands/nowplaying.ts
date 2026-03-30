import type { CommandData, ChatInputCommand } from "commandkit";
import { playerManager } from "../../services/player-manager.js";
import { nowPlayingEmbed, errorEmbed } from "../../services/embeds.js";

export const command: CommandData = {
  name: "nowplaying",
  description: "Show what is currently playing / عرض ما يتم تشغيله حالياً",
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  if (!interaction.guild) {
    await interaction.reply({ embeds: [errorEmbed("This command can only be used in a server.")], ephemeral: true });
    return;
  }

  const state = playerManager.get(interaction.guild.id);

  if (!state || !state.currentSurah) {
    await interaction.reply({
      embeds: [errorEmbed("Nothing is currently playing.\nلا يوجد شيء يعمل حالياً.")],
      ephemeral: true,
    });
    return;
  }

  const statusMap: Record<string, string> = {
    playing: "Playing / يعمل",
    paused: "Paused / متوقف مؤقتاً",
    idle: "Idle / خامل",
    connecting: "Connecting / جاري الاتصال",
    destroyed: "Destroyed / مدمر",
  };

  const status = statusMap[state.player.status] ?? state.player.status;

  await interaction.reply({
    embeds: [nowPlayingEmbed(state.currentSurah, state.currentReciter, state.player.volume, status)],
  });
};
