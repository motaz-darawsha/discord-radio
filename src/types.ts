import type { VoiceConnection, AudioPlayer, AudioResource, StreamType } from "@discordjs/voice";
import type { VoiceBasedChannel } from "discord.js";
import type { ChildProcess } from "node:child_process";
import type { RadioPlayerError } from "./errors.js";

/**
 * Represents the current state of the radio player.
 */
export enum PlayerStatus {
  /** The player is idle and not connected to any voice channel. */
  Idle = "idle",
  /** The player is connecting to a voice channel. */
  Connecting = "connecting",
  /** The player is actively playing audio. */
  Playing = "playing",
  /** The player is paused. */
  Paused = "paused",
  /** The player has been destroyed. */
  Destroyed = "destroyed",
}

/**
 * FFmpeg-related configuration options.
 */
export interface FFmpegOptions {
  /**
   * The path or command name of the FFmpeg binary.
   * @default "ffmpeg"
   */
  path?: string;

  /**
   * Additional FFmpeg input arguments prepended before the input URL.
   * Useful for headers, timeouts, reconnect options, etc.
   * @default ["-reconnect", "1", "-reconnect_streamed", "1", "-reconnect_delay_max", "5"]
   */
  inputArgs?: string[];

  /**
   * Additional FFmpeg output arguments appended after the output format flags.
   * @default []
   */
  outputArgs?: string[];
}

/**
 * Options for creating a new RadioPlayer instance.
 */
export interface RadioPlayerOptions {
  /**
   * The initial volume level (0-100).
   * @default 100
   */
  defaultVolume?: number;

  /**
   * Whether to automatically leave the voice channel when playback stops.
   * @default true
   */
  autoLeave?: boolean;

  /**
   * Whether the bot should join the voice channel deafened.
   * @default true
   */
  selfDeaf?: boolean;

  /**
   * Whether to loop the current stream when it finishes.
   * @default false
   */
  loop?: boolean;

  /**
   * Maximum time in milliseconds to wait for a voice connection to become ready.
   * @default 30000
   */
  connectionTimeout?: number;

  /**
   * FFmpeg configuration options.
   */
  ffmpeg?: FFmpegOptions;
}

/**
 * Options for the `play()` method.
 */
export interface PlayOptions {
  /**
   * The volume level (0-100) for this specific playback.
   * Overrides the instance-level volume for this playback only.
   */
  volume?: number;

  /**
   * The input type hint for the audio resource.
   * Use this if you know the stream type to skip probing.
   */
  inputType?: StreamType;

  /**
   * FFmpeg argument overrides for this specific playback.
   */
  ffmpeg?: Pick<FFmpegOptions, "inputArgs" | "outputArgs">;
}

/**
 * Snapshot of the player's current state.
 */
export interface PlayerState {
  /** Current status of the player. */
  status: PlayerStatus;
  /** Current volume level (0-100). */
  volume: number;
  /** The voice channel the player is connected to, if any. */
  channel: VoiceBasedChannel | null;
  /** Whether the player has an active voice connection. */
  connected: boolean;
  /** The URL currently being played, or `null` if idle. */
  currentUrl: string | null;
  /** Whether loop mode is enabled. */
  loop: boolean;
  /** How long the current stream has been playing in milliseconds. */
  playbackDuration: number;
}

/**
 * Events emitted by the RadioPlayer.
 */
export interface RadioPlayerEvents {
  /** Emitted when playback starts. */
  play: [url: string];
  /** Emitted when playback stops (both manual and natural). */
  stop: [];
  /** Emitted when playback finishes naturally (stream ended, not user-stopped). */
  finish: [url: string];
  /** Emitted when a looped stream restarts. */
  loop: [url: string, count: number];
  /** Emitted when playback is paused. */
  pause: [];
  /** Emitted when playback is resumed. */
  resume: [];
  /** Emitted when volume changes. */
  volumeChange: [volume: number];
  /** Emitted when the player encounters an error. */
  error: [error: RadioPlayerError];
  /** Emitted when the player's status changes. */
  statusChange: [oldStatus: PlayerStatus, newStatus: PlayerStatus];
  /** Emitted when the player is destroyed. */
  destroy: [];
  /** Emitted when the player connects to a voice channel. */
  connect: [channel: VoiceBasedChannel];
  /** Emitted when the player disconnects from a voice channel. */
  disconnect: [];
}

/**
 * @internal
 * Resolved (required) version of RadioPlayerOptions used internally.
 */
export interface ResolvedOptions {
  readonly defaultVolume: number;
  readonly autoLeave: boolean;
  readonly selfDeaf: boolean;
  readonly loop: boolean;
  readonly connectionTimeout: number;
  readonly ffmpeg: Readonly<Required<FFmpegOptions>>;
}

/**
 * @internal
 * Internal state tracked by the player.
 */
export interface InternalPlayerState {
  status: PlayerStatus;
  volume: number;
  loop: boolean;
  loopCount: number;
  connection: VoiceConnection | null;
  player: AudioPlayer | null;
  resource: AudioResource | null;
  channel: VoiceBasedChannel | null;
  currentUrl: string | null;
  ffmpegProcess: ChildProcess | null;
  playbackStartedAt: number | null;
  pausedAt: number | null;
  totalPausedDuration: number;
}
