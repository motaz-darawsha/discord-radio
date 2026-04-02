# discord-radio

A minimal, flexible audio stream player for Discord voice channels. Built with TypeScript, uses **FFmpeg** (`spawn`) for robust audio processing, and supports **ESM**, **CommonJS**, and **TypeScript** out of the box.

## Features

- Play any audio stream URL in Discord voice channels
- Playback controls: **play**, **stop**, **pause**, **resume**
- **Real-time volume control** (0–100) — changes instantly without restarting the stream
- **Loop mode** — auto-replay when a stream finishes
- **`finish` event** — fires only on natural stream end (not manual stop)
- **`playbackDuration`** — tracks elapsed playback time, accounting for pauses
- **`selfDeaf`** option — configurable bot deafen on join
- Auto-leave voice channel when playback stops
- Full TypeScript support with strict types
- Dual **ESM** / **CJS** build — works everywhere
- Event-driven architecture for full control
- Organized FFmpeg options (`ffmpeg: { path, inputArgs, outputArgs }`)
- Minimal dependencies

## Requirements

- **Node.js** >= 18.0.0
- **discord.js** >= 14.0.0
- **FFmpeg** installed on the system (or use [`ffmpeg-static`](https://www.npmjs.com/package/ffmpeg-static))
- An Opus library — one of:
  - [`@discordjs/opus`](https://www.npmjs.com/package/@discordjs/opus) (recommended)
  - [`opusscript`](https://www.npmjs.com/package/opusscript)

## Installation

```bash
npm install github:motazdarawsha/discord-radio @discordjs/opus
```

```bash
yarn add github:motazdarawsha/discord-radio @discordjs/opus
```

```bash
pnpm add github:motazdarawsha/discord-radio @discordjs/opus
```

> Make sure FFmpeg is installed on your system. On Ubuntu: `sudo apt install ffmpeg`

## Quick Start

### TypeScript

```typescript
import { Client, GatewayIntentBits } from "discord.js";
import { RadioPlayer } from "discord-radio";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const player = new RadioPlayer({
  defaultVolume: 80,
  autoLeave: true,
  selfDeaf: true,
  loop: false,
  ffmpeg: {
    path: "ffmpeg",
  },
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!play") {
    const channel = message.member?.voice.channel;
    if (!channel) {
      await message.reply("You need to be in a voice channel!");
      return;
    }

    await player.play(channel, "https://example.com/stream.mp3");
    await message.reply("Now playing!");
  }

  if (message.content === "!stop") {
    player.stop();
    await message.reply("Stopped!");
  }

  if (message.content === "!pause") {
    player.pause();
    await message.reply("Paused!");
  }

  if (message.content === "!resume") {
    player.resume();
    await message.reply("Resumed!");
  }

  if (message.content === "!loop") {
    player.setLoop(!player.loop);
    await message.reply(`Loop: ${player.loop ? "ON" : "OFF"}`);
  }

  if (message.content.startsWith("!volume")) {
    const vol = parseInt(message.content.split(" ")[1] ?? "");
    if (isNaN(vol)) {
      await message.reply("Usage: !volume <0-100>");
      return;
    }
    player.setVolume(vol);
    await message.reply(`Volume set to ${vol}%`);
  }

  if (message.content === "!status") {
    const state = player.getState();
    await message.reply(
      `Status: ${state.status}\n` +
      `Volume: ${state.volume}%\n` +
      `Loop: ${state.loop}\n` +
      `Duration: ${Math.round(state.playbackDuration / 1000)}s\n` +
      `URL: ${state.currentUrl ?? "none"}`
    );
  }
});

// Listen for natural stream end
player.on("finish", (url) => {
  console.log(`Stream finished naturally: ${url}`);
});

// Listen for loop restart
player.on("loop", (url, count) => {
  console.log(`Looped ${count} time(s): ${url}`);
});

client.login("YOUR_BOT_TOKEN");
```

### CommonJS

```javascript
const { Client, GatewayIntentBits } = require("discord.js");
const { RadioPlayer } = require("discord-radio");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const player = new RadioPlayer({ defaultVolume: 80 });

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const channel = message.member?.voice.channel;

  if (message.content === "!play" && channel) {
    await player.play(channel, "https://example.com/stream.mp3");
  }

  if (message.content === "!stop") player.stop();
  if (message.content === "!pause") player.pause();
  if (message.content === "!resume") player.resume();
  if (message.content === "!loop") player.setLoop(!player.loop);
});

client.login("YOUR_BOT_TOKEN");
```

### ESM (JavaScript)

```javascript
import { Client, GatewayIntentBits } from "discord.js";
import { RadioPlayer } from "discord-radio";

const player = new RadioPlayer({ defaultVolume: 80, loop: true });

// Same usage as TypeScript example above
```

## API Reference

### `new RadioPlayer(options?)`

Creates a new player instance.

| Option              | Type            | Default     | Description                                        |
| ------------------- | --------------- | ----------- | -------------------------------------------------- |
| `defaultVolume`     | `number`        | `100`       | Initial volume level (0–100)                       |
| `autoLeave`         | `boolean`       | `true`      | Auto-leave voice channel when playback stops       |
| `selfDeaf`          | `boolean`       | `true`      | Whether the bot joins deafened                     |
| `loop`              | `boolean`       | `false`     | Whether to auto-replay when the stream finishes    |
| `connectionTimeout` | `number`        | `30000`     | Max time (ms) to wait for voice connection         |
| `ffmpeg`            | `FFmpegOptions` | see below   | FFmpeg configuration                               |

#### `FFmpegOptions`

| Option      | Type       | Default                                                                          | Description                     |
| ----------- | ---------- | -------------------------------------------------------------------------------- | ------------------------------- |
| `path`      | `string`   | `"ffmpeg"`                                                                       | Path or command name of FFmpeg  |
| `inputArgs` | `string[]` | `["-reconnect", "1", "-reconnect_streamed", "1", "-reconnect_delay_max", "5"]`   | Extra FFmpeg input arguments    |
| `outputArgs`| `string[]` | `[]`                                                                             | Extra FFmpeg output arguments   |

### Methods

#### `player.play(channel, url, options?)`

Plays an audio stream URL in the given voice channel using FFmpeg.

- `channel` — `VoiceBasedChannel` — The Discord voice channel to join.
- `url` — `string` — The audio stream URL to play.
- `options.volume` — `number` (optional) — Override volume for this playback.
- `options.inputType` — `StreamType` (optional) — Hint for the stream type.
- `options.ffmpeg.inputArgs` — `string[]` (optional) — Override FFmpeg input args.
- `options.ffmpeg.outputArgs` — `string[]` (optional) — Override FFmpeg output args.

Returns: `Promise<void>`

#### `player.stop()`

Stops playback and kills the FFmpeg process. If `autoLeave` is enabled, the bot leaves the voice channel.

#### `player.pause()`

Pauses playback. Returns `true` if successfully paused.

#### `player.resume()`

Resumes playback. Returns `true` if successfully resumed.

#### `player.setVolume(level)`

Sets the volume level (0–100). Volume is adjusted in real-time via the inline volume transformer — **no stream restart**.

#### `player.setLoop(enabled)`

Enables or disables loop mode. When enabled, the current stream automatically restarts when it finishes naturally.

#### `player.getState()`

Returns a snapshot of the player's current state:

```typescript
{
  status: PlayerStatus;
  volume: number;
  channel: VoiceBasedChannel | null;
  connected: boolean;
  currentUrl: string | null;
  loop: boolean;
  playbackDuration: number; // ms
}
```

#### `player.disconnect()`

Disconnects from the voice channel without destroying the player.

#### `player.destroy()`

Destroys the player instance and releases all resources. The instance cannot be reused.

### Properties

| Property           | Type                        | Description                                       |
| ------------------ | --------------------------- | ------------------------------------------------- |
| `status`           | `PlayerStatus`              | Current player status                             |
| `volume`           | `number`                    | Current volume level (0–100)                      |
| `currentUrl`       | `string \| null`            | Currently playing URL                             |
| `channel`          | `VoiceBasedChannel \| null` | Connected voice channel                           |
| `isPlaying`        | `boolean`                   | Whether audio is currently playing                |
| `isPaused`         | `boolean`                   | Whether playback is paused                        |
| `isConnected`      | `boolean`                   | Whether connected to a channel                    |
| `loop`             | `boolean`                   | Whether loop mode is enabled                      |
| `playbackDuration` | `number`                    | Elapsed playback time in ms (accounts for pauses) |

### Events

| Event          | Payload                                    | Description                                  |
| -------------- | ------------------------------------------ | -------------------------------------------- |
| `play`         | `(url: string)`                            | Playback started                             |
| `stop`         | `()`                                       | Playback stopped (manual or natural)         |
| `finish`       | `(url: string)`                            | Stream finished naturally (not manual stop)   |
| `loop`         | `(url: string, count: number)`             | Looped stream restarted                      |
| `pause`        | `()`                                       | Playback paused                              |
| `resume`       | `()`                                       | Playback resumed                             |
| `volumeChange` | `(volume: number)`                         | Volume level changed                         |
| `error`        | `(error: RadioPlayerError)`                | An error occurred                            |
| `statusChange` | `(old: PlayerStatus, new: PlayerStatus)`   | Player status changed                        |
| `connect`      | `(channel: VoiceBasedChannel)`             | Connected to a voice channel                 |
| `disconnect`   | `()`                                       | Disconnected from voice channel              |
| `destroy`      | `()`                                       | Player instance destroyed                    |

### `PlayerStatus`

```typescript
enum PlayerStatus {
  Idle = "idle",
  Connecting = "connecting",
  Playing = "playing",
  Paused = "paused",
  Destroyed = "destroyed",
}
```

### Error Classes

All errors extend `RadioPlayerError`:

| Class              | Code               | Description                         |
| ------------------ | ------------------ | ----------------------------------- |
| `RadioPlayerError` | varies             | Base error class                    |
| `InvalidStateError`| `INVALID_STATE`    | Operation not allowed in this state |
| `ConnectionError`  | `CONNECTION_ERROR` | Voice connection failed             |
| `ValidationError`  | `VALIDATION_ERROR` | Invalid argument provided           |
| `PlaybackError`    | `PLAYBACK_ERROR`   | Audio playback failed               |
| `FFmpegError`      | `FFMPEG_ERROR`     | FFmpeg process failed               |

## Advanced Usage

### Event Handling

```typescript
import { RadioPlayer, PlayerStatus } from "discord-radio";

const player = new RadioPlayer();

player.on("statusChange", (oldStatus, newStatus) => {
  console.log(`Status: ${oldStatus} → ${newStatus}`);
});

player.on("error", (error) => {
  console.error(`[${error.code}] ${error.message}`);
});

player.on("play", (url) => {
  console.log(`Now playing: ${url}`);
});

player.on("finish", (url) => {
  console.log(`Stream ended: ${url}`);
});

player.on("loop", (url, count) => {
  console.log(`Loop #${count}: ${url}`);
});
```

### Custom FFmpeg Path

```typescript
import { RadioPlayer } from "discord-radio";

// Use ffmpeg-static
import ffmpegPath from "ffmpeg-static";

const player = new RadioPlayer({
  defaultVolume: 80,
  ffmpeg: {
    path: ffmpegPath ?? "ffmpeg",
  },
});
```

### Custom FFmpeg Arguments

```typescript
import { RadioPlayer } from "discord-radio";

const player = new RadioPlayer({
  ffmpeg: {
    inputArgs: [
      "-reconnect", "1",
      "-reconnect_streamed", "1",
      "-reconnect_delay_max", "10",
      "-headers", "User-Agent: MyBot/1.0",
    ],
  },
});
```

### Loop Mode

```typescript
import { RadioPlayer } from "discord-radio";

const player = new RadioPlayer({ loop: true });

player.on("loop", (url, count) => {
  console.log(`Restarted stream (loop #${count}): ${url}`);
});

player.on("finish", (url) => {
  // This fires before each loop restart
  console.log(`Stream finished: ${url}`);
});
```

### Playback Duration

```typescript
const player = new RadioPlayer();

// After playing for a while...
console.log(`Playing for ${player.playbackDuration}ms`);

// Or via getState()
const state = player.getState();
console.log(`Duration: ${Math.round(state.playbackDuration / 1000)}s`);
```

### Multiple Players (Per Guild)

```typescript
import { RadioPlayer } from "discord-radio";

const players = new Map<string, RadioPlayer>();

function getPlayer(guildId: string): RadioPlayer {
  let player = players.get(guildId);
  if (!player) {
    player = new RadioPlayer({ defaultVolume: 80 });
    players.set(guildId, player);
  }
  return player;
}
```

## Migration from v1.0.x

### Breaking Changes

Options have been restructured for better organization:

```typescript
// Before (v1.0.x)
const player = new RadioPlayer({
  volume: 80,
  ffmpegPath: "ffmpeg",
  ffmpegInputArgs: ["-reconnect", "1"],
  ffmpegOutputArgs: [],
});

// After (v1.1.0)
const player = new RadioPlayer({
  defaultVolume: 80,
  ffmpeg: {
    path: "ffmpeg",
    inputArgs: ["-reconnect", "1"],
    outputArgs: [],
  },
});
```

`PlayOptions` also changed:

```typescript
// Before (v1.0.x)
await player.play(channel, url, {
  ffmpegInputArgs: [...],
  ffmpegOutputArgs: [...],
});

// After (v1.1.0)
await player.play(channel, url, {
  ffmpeg: {
    inputArgs: [...],
    outputArgs: [...],
  },
});
```

### New Features

- `loop` option and `setLoop()` method
- `finish` event (natural stream end only)
- `loop` event (stream restarted)
- `selfDeaf` option
- `playbackDuration` property
- Enhanced `getState()` with `currentUrl`, `loop`, `playbackDuration`
- Real-time volume changes (no stream restart)

## License

[MIT](./LICENSE)
