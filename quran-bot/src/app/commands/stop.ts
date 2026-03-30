import type { CommandData, ChatInputCommand } from "commandkit";
import { GuildMember } from "discord.js";
import { playerManager } from "../../services/player-manager.js";
import { stoppedEmbed, errorEmbed } from "../../services/embeds.js";

export const command: CommandData = {
  name: "stop",
  description: "Stop playback and leave the voice channel / إيقاف التشغيل ومغادرة القناة الصوتية",
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

  const stopped = playerManager.stop(interaction.guild.id);

  if (!stopped) {
    await interaction.reply({
      embeds: [errorEmbed("Nothing is currently playing.\nلا يوجد شيء يعمل حالياً.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({ embeds: [stoppedEmbed()] });
};
