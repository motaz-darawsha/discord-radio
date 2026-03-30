import type { CommandData, ChatInputCommand } from "commandkit";
import { ApplicationCommandOptionType } from "discord.js";
import { RECITERS } from "../../data/reciters.js";
import { recitersListEmbed } from "../../services/embeds.js";

const PAGE_SIZE = 10;

export const command: CommandData = {
  name: "reciters",
  description: "List available reciters / عرض قائمة القراء المتاحين",
  options: [
    {
      name: "page",
      description: "Page number / رقم الصفحة",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      min_value: 1,
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  const totalPages = Math.ceil(RECITERS.length / PAGE_SIZE);
  let page = interaction.options.getInteger("page", false) ?? 1;

  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const recitersPage = RECITERS.slice(start, end);

  await interaction.reply({
    embeds: [recitersListEmbed(recitersPage, page, totalPages)],
  });
};
