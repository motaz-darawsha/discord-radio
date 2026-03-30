import type { CommandData, ChatInputCommand } from "commandkit";
import { GuildMember } from "discord.js";
import { playerManager } from "../../services/player-manager.js";
import { resumedEmbed, errorEmbed } from "../../services/embeds.js";

export const command: CommandData = {
  name: "resume",
  description: "Resume paused playback / استئناف التشغيل",
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

  const resumed = playerManager.resume(interaction.guild.id);

  if (!resumed) {
    await interaction.reply({
      embeds: [errorEmbed("Nothing is currently paused.\nلا يوجد شيء متوقف مؤقتاً.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({ embeds: [resumedEmbed()] });
};
