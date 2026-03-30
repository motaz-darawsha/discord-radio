# Quran Bot 🕌

A professional Quran recitation Discord bot built with [CommandKit](https://commandkit.js.org/), [discord.js](https://discord.js.org/), and [discord-radio](https://github.com/motaz-darawsha/discord-radio).

## Features

- **Quran Audio Streaming** - Stream Quran recitations directly in Discord voice channels
- **15+ Reciters** - Choose from popular reciters like Mishary Alafasy, Abdul Basit, Maher Al-Muaiqly, and more
- **All 114 Surahs** - Complete Quran coverage with Arabic and English names
- **Autocomplete** - Smart autocomplete for surah and reciter selection as you type
- **Playback Controls** - Play, pause, resume, stop, and volume control
- **Bilingual** - Arabic and English interface
- **Professional Embeds** - Beautiful embedded messages for all responses
- **Auto-Leave** - Automatically leaves the voice channel when playback stops

## Commands

| Command | Description |
|---------|-------------|
| `/play <surah> [reciter] [volume]` | Play a Quran surah in your voice channel |
| `/stop` | Stop playback and leave the voice channel |
| `/pause` | Pause current playback |
| `/resume` | Resume paused playback |
| `/volume <level>` | Set volume (0-100) |
| `/nowplaying` | Show current playback info |
| `/reciters [page]` | List all available reciters |

## Setup

### Prerequisites

- Node.js v24 or higher
- FFmpeg installed on your system
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

```bash
cd quran-bot
npm install
```

### Configuration

Copy the `.env.example` file and fill in your values:

```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=your_discord_bot_token_here
DEV_GUILD_ID=your_dev_guild_id_here  # optional, for faster dev command registration
```

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Reciters

The bot includes 15 popular reciters:

1. مشاري راشد العفاسي - Mishary Rashid Alafasy
2. عبدالرحمن السديس - Abdurrahman As-Sudais
3. سعود الشريم - Saud Ash-Shuraim
4. ماهر المعيقلي - Maher Al-Muaiqly
5. عبدالباسط عبدالصمد - Abdul Basit Abdul Samad
6. هزاع البلوشي - Hazza Al-Balushi
7. أحمد العجمي - Ahmed Al-Ajmi
8. ياسر الدوسري - Yasser Ad-Dossari
9. ناصر القطامي - Nasser Al-Qatami
10. فارس عباد - Fares Abbad
11. إبراهيم الأخضر - Ibrahim Al-Akhdar
12. محمد صديق المنشاوي - Muhammad Siddiq Al-Minshawi
13. علي الحذيفي - Ali Al-Hudhaify
14. محمود خليل الحصري - Mahmoud Khalil Al-Hussary
15. سعد الغامدي - Saad Al-Ghamdi

## Audio Source

Audio files are streamed from [mp3quran.net](https://mp3quran.net/), a free and reliable Quran audio API.

## Tech Stack

- **[CommandKit v1](https://commandkit.js.org/)** - Discord bot meta-framework
- **[discord.js v14](https://discord.js.org/)** - Discord API library
- **[discord-radio](https://github.com/motaz-darawsha/discord-radio)** - Audio streaming with FFmpeg
- **TypeScript** - Strict type safety

## License

MIT
