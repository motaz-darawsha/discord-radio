import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  VoiceConnectionDisconnectReason,
  NoSubscriberBehavior,
  StreamType,
} from "@discordjs/voice";
import type {
  VoiceConnection,
  AudioPlayer,
  AudioResource,
} from "@discordjs/voice";
import type { VoiceBasedChannel } from "discord.js";
import { EventEmitter } from "node:events";
import { spawn, type ChildProcess } from "node:child_process";

import {
  PlayerStatus,
  type RadioPlayerOptions,
  type PlayOptions,
  type PlayerState,
  type RadioPlayerEvents,
  type InternalPlayerState,
} from "./types.js";
import {
  RadioPlayerError,
  InvalidStateError,
  ConnectionError,
  ValidationError,
  PlaybackError,
  FFmpegError,
} from "./errors.js";

/**
 * Default FFmpeg input arguments for stream reconnection.
 */
const DEFAULT_FFMPEG_INPUT_ARGS: readonly string[] = [
  "-reconnect", "1",
  "-reconnect_streamed", "1",
  "-reconnect_delay_max", "5",
];

/**
 * Default options for the RadioPlayer.
 */
const DEFAULT_OPTIONS: Required<RadioPlayerOptions> = {
  autoLeave: true,
  volume: 100,
  connectionTimeout: 30_000,
  ffmpegPath: "ffmpeg",
  ffmpegInputArgs: [...DEFAULT_FFMPEG_INPUT_ARGS],
  ffmpegOutputArgs: [],
};

/**
 * Clamps a number between a minimum and maximum value.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validates that a value is a finite number.
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Converts a volume level (0-100) to a FFmpeg volume filter value.
 * FFmpeg volume filter uses a float where 1.0 = 100%.
 */
function volumeToFFmpeg(volume: number): string {
  return (volume / 100).toFixed(2);
}

/**
 * A flexible, minimal audio stream player for Discord voice channels.
 * Uses FFmpeg (spawn) for audio processing, supporting any stream URL.
 *
 * @example
 * ```typescript
 * import { RadioPlayer } from "discord-radio";
 *
 * const player = new RadioPlayer({ volume: 80 });
 *
 * // Play a stream URL
 * await player.play(voiceChannel, "https://example.com/stream.mp3");
 *
 * // Control playback
 * player.pause();
 * player.resume();
 * player.setVolume(50);
 * player.stop(); // auto-leaves channel
 * ```
 */
export class RadioPlayer extends EventEmitter<RadioPlayerEvents> {
  private readonly options: Required<RadioPlayerOptions>;
  private state: InternalPlayerState;

  constructor(options?: RadioPlayerOptions) {
    super();

    this.options = { ...DEFAULT_OPTIONS, ...options };

    if (!isFiniteNumber(this.options.volume) || this.options.volume < 0 || this.options.volume > 100) {
      throw new ValidationError("Volume must be a number between 0 and 100.");
    }

    if (!isFiniteNumber(this.options.connectionTimeout) || this.options.connectionTimeout < 0) {
      throw new ValidationError("Connection timeout must be a non-negative number.");
    }

    if (typeof this.options.ffmpegPath !== "string" || this.options.ffmpegPath.trim().length === 0) {
      throw new ValidationError("FFmpeg path must be a non-empty string.");
    }

    this.state = {
      status: PlayerStatus.Idle,
      volume: this.options.volume,
      connection: null,
      player: null,
      resource: null,
      channel: null,
      currentUrl: null,
      ffmpegProcess: null,
    };
  }

  /**
   * Returns a snapshot of the player's current state.
   */
  public getState(): PlayerState {
    return {
      status: this.state.status,
      volume: this.state.volume,
      channel: this.state.channel,
      connected: this.state.connection !== null,
    };
  }

  /**
   * Returns the current player status.
   */
  public get status(): PlayerStatus {
    return this.state.status;
  }

  /**
   * Returns the current volume level (0-100).
   */
  public get volume(): number {
    return this.state.volume;
  }

  /**
   * Returns the currently playing URL, or `null` if nothing is playing.
   */
  public get currentUrl(): string | null {
    return this.state.currentUrl;
  }

  /**
   * Returns the voice channel the player is connected to, or `null`.
   */
  public get channel(): VoiceBasedChannel | null {
    return this.state.channel;
  }

  /**
   * Returns whether the player is currently playing audio.
   */
  public get isPlaying(): boolean {
    return this.state.status === PlayerStatus.Playing;
  }

  /**
   * Returns whether the player is currently paused.
   */
  public get isPaused(): boolean {
    return this.state.status === PlayerStatus.Paused;
  }

  /**
   * Returns whether the player is connected to a voice channel.
   */
  public get isConnected(): boolean {
    return this.state.connection !== null;
  }

  /**
   * Plays an audio stream URL in the specified voice channel.
   * Spawns an FFmpeg process to decode the audio stream and pipes it
   * to the Discord voice connection.
   *
   * If the player is already playing, the current playback will be stopped
   * and the new stream will start.
   *
   * @param channel - The voice channel to join and play in.
   * @param url - The audio stream URL to play.
   * @param options - Optional playback options.
   * @throws {ValidationError} If the input is invalid.
   * @throws {ConnectionError} If the voice connection fails.
   * @throws {FFmpegError} If spawning FFmpeg fails.
   * @throws {InvalidStateError} If the player has been destroyed.
   */
  public async play(
    channel: VoiceBasedChannel,
    url: string,
    options?: PlayOptions,
  ): Promise<void> {
    this.assertNotDestroyed();

    if (!channel) {
      throw new ValidationError("A voice channel is required.");
    }

    if (typeof url !== "string" || url.trim().length === 0) {
      throw new ValidationError("The audio URL must be a non-empty string.");
    }

    const playVolume = options?.volume ?? this.state.volume;

    if (!isFiniteNumber(playVolume) || playVolume < 0 || playVolume > 100) {
      throw new ValidationError("Volume must be a number between 0 and 100.");
    }

    // Stop current playback if any
    if (this.state.status === PlayerStatus.Playing || this.state.status === PlayerStatus.Paused) {
      this.stopInternal(false);
    }

    const oldStatus = this.state.status;
    this.state.status = PlayerStatus.Connecting;
    this.emitStatusChange(oldStatus, PlayerStatus.Connecting);

    try {
      // Create or reuse voice connection
      const connection = await this.ensureConnection(channel);

      // Create audio player
      const player = this.createPlayer();

      // Subscribe the connection to the player
      connection.subscribe(player);

      // Spawn FFmpeg and create audio resource
      const inputArgs = options?.ffmpegInputArgs ?? this.options.ffmpegInputArgs;
      const outputArgs = options?.ffmpegOutputArgs ?? this.options.ffmpegOutputArgs;
      const { process: ffmpegProcess, resource } = this.spawnFFmpeg(url, playVolume, inputArgs, outputArgs);

      player.play(resource);

      // Update internal state
      this.state.connection = connection;
      this.state.player = player;
      this.state.resource = resource;
      this.state.channel = channel;
      this.state.volume = playVolume;
      this.state.currentUrl = url;
      this.state.ffmpegProcess = ffmpegProcess;
      this.state.status = PlayerStatus.Playing;

      this.emitStatusChange(PlayerStatus.Connecting, PlayerStatus.Playing);
      this.emit("play", url);
    } catch (error) {
      this.state.status = oldStatus === PlayerStatus.Connecting ? PlayerStatus.Idle : oldStatus;

      if (error instanceof RadioPlayerError) {
        this.emit("error", error);
        throw error;
      }

      const wrappedError = new PlaybackError(
        `Failed to start playback: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.emit("error", wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Stops playback and optionally disconnects from the voice channel.
   *
   * @throws {InvalidStateError} If the player has been destroyed.
   */
  public stop(): void {
    this.assertNotDestroyed();
    this.stopInternal(this.options.autoLeave);
  }

  /**
   * Pauses the current playback.
   *
   * @returns `true` if the player was paused, `false` if it was not playing.
   * @throws {InvalidStateError} If the player has been destroyed.
   */
  public pause(): boolean {
    this.assertNotDestroyed();

    if (this.state.status !== PlayerStatus.Playing || !this.state.player) {
      return false;
    }

    const paused = this.state.player.pause(true);

    if (paused) {
      this.state.status = PlayerStatus.Paused;
      this.emitStatusChange(PlayerStatus.Playing, PlayerStatus.Paused);
      this.emit("pause");
    }

    return paused;
  }

  /**
   * Resumes the current playback.
   *
   * @returns `true` if the player was resumed, `false` if it was not paused.
   * @throws {InvalidStateError} If the player has been destroyed.
   */
  public resume(): boolean {
    this.assertNotDestroyed();

    if (this.state.status !== PlayerStatus.Paused || !this.state.player) {
      return false;
    }

    const resumed = this.state.player.unpause();

    if (resumed) {
      this.state.status = PlayerStatus.Playing;
      this.emitStatusChange(PlayerStatus.Paused, PlayerStatus.Playing);
      this.emit("resume");
    }

    return resumed;
  }

  /**
   * Sets the volume level (0-100).
   *
   * When changing volume, the current FFmpeg process is respawned with
   * the new volume applied via the FFmpeg audio filter.
   *
   * @param level - The volume level (0-100).
   * @throws {ValidationError} If the volume is not a valid number.
   * @throws {InvalidStateError} If the player has been destroyed.
   */
  public setVolume(level: number): void {
    this.assertNotDestroyed();

    if (!isFiniteNumber(level)) {
      throw new ValidationError("Volume must be a finite number.");
    }

    const clamped = clamp(Math.round(level), 0, 100);
    const previousVolume = this.state.volume;
    this.state.volume = clamped;

    // If currently playing, restart FFmpeg with the new volume
    if (
      (this.state.status === PlayerStatus.Playing || this.state.status === PlayerStatus.Paused) &&
      this.state.currentUrl &&
      this.state.player &&
      this.state.connection &&
      previousVolume !== clamped
    ) {
      this.killFFmpeg();

      const { process: ffmpegProcess, resource } = this.spawnFFmpeg(
        this.state.currentUrl,
        clamped,
        this.options.ffmpegInputArgs,
        this.options.ffmpegOutputArgs,
      );

      this.state.ffmpegProcess = ffmpegProcess;
      this.state.resource = resource;
      this.state.player.play(resource);
    }

    this.emit("volumeChange", clamped);
  }

  /**
   * Destroys the player and releases all resources.
   *
   * After calling this method, the player cannot be used again.
   * Create a new instance if you need to play audio again.
   */
  public destroy(): void {
    if (this.state.status === PlayerStatus.Destroyed) {
      return;
    }

    this.stopInternal(true);

    const oldStatus = this.state.status;
    this.state.status = PlayerStatus.Destroyed;
    this.emitStatusChange(oldStatus, PlayerStatus.Destroyed);
    this.emit("destroy");
    this.removeAllListeners();
  }

  /**
   * Disconnects from the current voice channel without stopping the internal state tracking.
   *
   * @throws {InvalidStateError} If the player has been destroyed.
   */
  public disconnect(): void {
    this.assertNotDestroyed();
    this.destroyConnection();
  }

  // ─── Private Methods ─────────────────────────────────────────────────

  /**
   * Spawns an FFmpeg process to decode the given URL and returns
   * the child process along with an AudioResource piped from stdout.
   */
  private spawnFFmpeg(
    url: string,
    volume: number,
    inputArgs: string[],
    outputArgs: string[],
  ): { process: ChildProcess; resource: AudioResource } {
    const args: string[] = [
      ...inputArgs,
      "-i", url,
      "-analyzeduration", "0",
      "-loglevel", "error",
      "-af", `volume=${volumeToFFmpeg(volume)}`,
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "2",
      ...outputArgs,
      "pipe:1",
    ];

    const ffmpegProcess = spawn(this.options.ffmpegPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (!ffmpegProcess.stdout) {
      ffmpegProcess.kill("SIGKILL");
      throw new FFmpegError("FFmpeg process did not provide stdout.");
    }

    // Collect stderr for error messages
    let stderrData = "";
    ffmpegProcess.stderr?.on("data", (chunk: Buffer) => {
      stderrData += chunk.toString();
      // Limit collected stderr to prevent memory issues
      if (stderrData.length > 4096) {
        stderrData = stderrData.slice(-2048);
      }
    });

    ffmpegProcess.on("error", (error) => {
      const ffmpegError = new FFmpegError(
        `FFmpeg process error: ${error.message}`,
      );
      this.emit("error", ffmpegError);
    });

    ffmpegProcess.on("close", (code) => {
      if (code !== null && code !== 0 && this.state.status === PlayerStatus.Playing) {
        const errorMessage = stderrData.trim() || `FFmpeg exited with code ${String(code)}`;
        const ffmpegError = new FFmpegError(`FFmpeg error: ${errorMessage}`);
        this.emit("error", ffmpegError);
      }
    });

    const resource = createAudioResource(ffmpegProcess.stdout, {
      inputType: StreamType.Raw,
      inlineVolume: false,
    });

    return { process: ffmpegProcess, resource };
  }

  /**
   * Kills the current FFmpeg process if it exists.
   */
  private killFFmpeg(): void {
    if (this.state.ffmpegProcess) {
      try {
        this.state.ffmpegProcess.removeAllListeners();
        this.state.ffmpegProcess.stderr?.removeAllListeners();

        if (!this.state.ffmpegProcess.killed) {
          this.state.ffmpegProcess.kill("SIGKILL");
        }
      } catch {
        // Process may already be dead
      }
      this.state.ffmpegProcess = null;
    }
  }

  /**
   * Ensures a voice connection is established to the given channel.
   */
  private async ensureConnection(channel: VoiceBasedChannel): Promise<VoiceConnection> {
    const guildId = channel.guild.id;

    // Destroy existing connection if it's to a different channel
    if (this.state.connection && this.state.channel?.id !== channel.id) {
      this.destroyConnection();
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    this.setupConnectionListeners(connection);

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, this.options.connectionTimeout);
    } catch {
      connection.destroy();
      throw new ConnectionError(
        `Voice connection timed out after ${this.options.connectionTimeout}ms.`,
      );
    }

    this.emit("connect", channel);
    return connection;
  }

  /**
   * Sets up listeners on the voice connection to handle disconnects and state changes.
   */
  private setupConnectionListeners(connection: VoiceConnection): void {
    connection.on(VoiceConnectionStatus.Disconnected, async (_oldState, newState) => {
      const closeCode = (newState as { reason?: number }).reason;

      if (
        closeCode === VoiceConnectionDisconnectReason.WebSocketClose &&
        (newState as { closeCode?: number }).closeCode === 4014
      ) {
        try {
          await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
        } catch {
          this.destroyConnection();
        }
      } else if (connection.rejoinAttempts < 5) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, (connection.rejoinAttempts + 1) * 5_000);
        });
        connection.rejoin();
      } else {
        this.destroyConnection();
      }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
      this.cleanupState();
      this.emit("disconnect");
    });
  }

  /**
   * Creates a new audio player with appropriate configuration.
   */
  private createPlayer(): AudioPlayer {
    // Stop and clean up old player if it exists
    if (this.state.player) {
      this.state.player.stop(true);
      this.state.player.removeAllListeners();
    }

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    player.on("error", (error) => {
      const wrappedError = new PlaybackError(
        `Audio player error: ${error.message}`,
      );
      this.emit("error", wrappedError);
      this.stopInternal(this.options.autoLeave);
    });

    player.on(AudioPlayerStatus.Idle, () => {
      // Playback finished naturally
      if (
        this.state.status === PlayerStatus.Playing ||
        this.state.status === PlayerStatus.Paused
      ) {
        this.stopInternal(this.options.autoLeave);
      }
    });

    return player;
  }

  /**
   * Internal stop implementation.
   */
  private stopInternal(shouldLeave: boolean): void {
    const wasPlayingOrPaused =
      this.state.status === PlayerStatus.Playing ||
      this.state.status === PlayerStatus.Paused;

    // Kill FFmpeg process
    this.killFFmpeg();

    // Stop the audio player
    if (this.state.player) {
      const player = this.state.player;
      this.state.player = null;
      player.stop(true);
      player.removeAllListeners();
    }

    // Clean up the resource
    this.state.resource = null;
    this.state.currentUrl = null;

    // Disconnect if needed
    if (shouldLeave) {
      this.destroyConnection();
    }

    if (wasPlayingOrPaused) {
      const oldStatus = this.state.status;
      this.state.status = PlayerStatus.Idle;
      this.emitStatusChange(oldStatus, PlayerStatus.Idle);
      this.emit("stop");
    }
  }

  /**
   * Destroys the voice connection and cleans up.
   */
  private destroyConnection(): void {
    if (this.state.connection) {
      try {
        if (this.state.connection.state.status !== VoiceConnectionStatus.Destroyed) {
          this.state.connection.destroy();
        }
      } catch {
        // Connection may already be destroyed
      }
      this.state.connection = null;
      this.state.channel = null;
    }
  }

  /**
   * Resets the internal state to idle.
   */
  private cleanupState(): void {
    this.killFFmpeg();

    if (this.state.player) {
      const player = this.state.player;
      this.state.player = null;
      player.stop(true);
      player.removeAllListeners();
    }

    this.state.resource = null;
    this.state.connection = null;
    this.state.channel = null;
    this.state.currentUrl = null;

    if (
      this.state.status !== PlayerStatus.Idle &&
      this.state.status !== PlayerStatus.Destroyed
    ) {
      const oldStatus = this.state.status;
      this.state.status = PlayerStatus.Idle;
      this.emitStatusChange(oldStatus, PlayerStatus.Idle);
    }
  }

  /**
   * Emits a status change event.
   */
  private emitStatusChange(oldStatus: PlayerStatus, newStatus: PlayerStatus): void {
    if (oldStatus !== newStatus) {
      this.emit("statusChange", oldStatus, newStatus);
    }
  }

  /**
   * Asserts that the player has not been destroyed.
   */
  private assertNotDestroyed(): void {
    if (this.state.status === PlayerStatus.Destroyed) {
      throw new InvalidStateError("This RadioPlayer instance has been destroyed and cannot be used.");
    }
  }
}
