import type { CommandData, ChatInputCommand } from "commandkit";
import { GuildMember } from "discord.js";
import { playerManager } from "../../services/player-manager.js";
import { pausedEmbed, errorEmbed } from "../../services/embeds.js";

export const command: CommandData = {
  name: "pause",
  description: "Pause the current playback / إيقاف مؤقت للتشغيل",
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
  if (!member.voice.channel) {
    await interaction.reply({
      embeds: [errorEmbed("You must be in a voice channel.\nيجب أن تكون في قناة صوتية.")],
      ephemeral: true,
    });
    return;
  }

  const paused = playerManager.pause(interaction.guild.id);

  if (!paused) {
    await interaction.reply({
      embeds: [errorEmbed("Nothing is currently playing to pause.\nلا يوجد شيء للإيقاف المؤقت.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({ embeds: [pausedEmbed()] });
};
