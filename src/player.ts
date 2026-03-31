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
  type ResolvedOptions,
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
 * Default resolved options for the RadioPlayer.
 */
const DEFAULT_OPTIONS: ResolvedOptions = {
  defaultVolume: 100,
  autoLeave: true,
  selfDeaf: true,
  loop: false,
  connectionTimeout: 30_000,
  ffmpeg: {
    path: "ffmpeg",
    inputArgs: [...DEFAULT_FFMPEG_INPUT_ARGS],
    outputArgs: [],
  },
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
 * Resolves user-provided options into a fully populated options object.
 */
function resolveOptions(options?: RadioPlayerOptions): ResolvedOptions {
  return {
    defaultVolume: options?.defaultVolume ?? DEFAULT_OPTIONS.defaultVolume,
    autoLeave: options?.autoLeave ?? DEFAULT_OPTIONS.autoLeave,
    selfDeaf: options?.selfDeaf ?? DEFAULT_OPTIONS.selfDeaf,
    loop: options?.loop ?? DEFAULT_OPTIONS.loop,
    connectionTimeout: options?.connectionTimeout ?? DEFAULT_OPTIONS.connectionTimeout,
    ffmpeg: {
      path: options?.ffmpeg?.path ?? DEFAULT_OPTIONS.ffmpeg.path,
      inputArgs: options?.ffmpeg?.inputArgs ?? [...DEFAULT_OPTIONS.ffmpeg.inputArgs],
      outputArgs: options?.ffmpeg?.outputArgs ?? [...DEFAULT_OPTIONS.ffmpeg.outputArgs],
    },
  };
}

/**
 * A flexible, minimal audio stream player for Discord voice channels.
 * Uses FFmpeg (spawn) for audio processing, supporting any stream URL.
 *
 * @example
 * ```typescript
 * import { RadioPlayer } from "discord-radio";
 *
 * const player = new RadioPlayer({
 *   defaultVolume: 80,
 *   loop: true,
 *   ffmpeg: { path: "ffmpeg" },
 * });
 *
 * // Play a stream URL
 * await player.play(voiceChannel, "https://example.com/stream.mp3");
 *
 * // Control playback
 * player.pause();
 * player.resume();
 * player.setVolume(50);
 * player.setLoop(false);
 * player.stop(); // auto-leaves channel
 * ```
 */
export class RadioPlayer extends EventEmitter<RadioPlayerEvents> {
  private readonly options: ResolvedOptions;
  private state: InternalPlayerState;

  constructor(options?: RadioPlayerOptions) {
    super();

    this.options = resolveOptions(options);

    if (!isFiniteNumber(this.options.defaultVolume) || this.options.defaultVolume < 0 || this.options.defaultVolume > 100) {
      throw new ValidationError("Default volume must be a number between 0 and 100.");
    }

    if (!isFiniteNumber(this.options.connectionTimeout) || this.options.connectionTimeout < 0) {
      throw new ValidationError("Connection timeout must be a non-negative number.");
    }

    if (typeof this.options.ffmpeg.path !== "string" || this.options.ffmpeg.path.trim().length === 0) {
      throw new ValidationError("FFmpeg path must be a non-empty string.");
    }

    this.state = {
      status: PlayerStatus.Idle,
      volume: this.options.defaultVolume,
      loop: this.options.loop,
      loopCount: 0,
      connection: null,
      player: null,
      resource: null,
      channel: null,
      currentUrl: null,
      ffmpegProcess: null,
      playbackStartedAt: null,
      pausedAt: null,
      totalPausedDuration: 0,
    };
  }

  // ─── Public Getters ─────────────────────────────────────────────────

  /**
   * Returns a snapshot of the player's current state.
   */
  public getState(): PlayerState {
    return {
      status: this.state.status,
      volume: this.state.volume,
      channel: this.state.channel,
      connected: this.state.connection !== null,
      currentUrl: this.state.currentUrl,
      loop: this.state.loop,
      playbackDuration: this.playbackDuration,
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
   * Returns whether loop mode is enabled.
   */
  public get loop(): boolean {
    return this.state.loop;
  }

  /**
   * Returns how long the current stream has been playing in milliseconds.
   * Accounts for time spent paused. Returns `0` if not playing.
   */
  public get playbackDuration(): number {
    if (this.state.playbackStartedAt === null) {
      return 0;
    }

    const now = Date.now();
    const elapsed = now - this.state.playbackStartedAt;
    const currentPause = this.state.pausedAt !== null ? now - this.state.pausedAt : 0;

    return Math.max(0, elapsed - this.state.totalPausedDuration - currentPause);
  }

  // ─── Public Methods ─────────────────────────────────────────────────

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

    // Stop current playback if any (manual stop, no finish event)
    if (this.state.status === PlayerStatus.Playing || this.state.status === PlayerStatus.Paused) {
      this.stopInternal(false, false);
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
      const inputArgs = options?.ffmpeg?.inputArgs ?? this.options.ffmpeg.inputArgs;
      const outputArgs = options?.ffmpeg?.outputArgs ?? this.options.ffmpeg.outputArgs;
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
      this.state.loopCount = 0;
      this.state.playbackStartedAt = Date.now();
      this.state.pausedAt = null;
      this.state.totalPausedDuration = 0;

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
    this.stopInternal(this.options.autoLeave, false);
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
      this.state.pausedAt = Date.now();
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
      if (this.state.pausedAt !== null) {
        this.state.totalPausedDuration += Date.now() - this.state.pausedAt;
        this.state.pausedAt = null;
      }
      this.state.status = PlayerStatus.Playing;
      this.emitStatusChange(PlayerStatus.Paused, PlayerStatus.Playing);
      this.emit("resume");
    }

    return resumed;
  }

  /**
   * Sets the volume level (0-100).
   *
   * Volume is adjusted in real-time via the inline volume transformer
   * without restarting the FFmpeg process or interrupting playback.
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

    // Adjust inline volume without restarting FFmpeg
    if (
      (this.state.status === PlayerStatus.Playing || this.state.status === PlayerStatus.Paused) &&
      this.state.resource?.volume &&
      previousVolume !== clamped
    ) {
      this.state.resource.volume.setVolume(clamped / 100);
    }

    this.emit("volumeChange", clamped);
  }

  /**
   * Enables or disables loop mode.
   * When enabled, the current stream will automatically restart when it finishes.
   *
   * @param enabled - Whether to enable loop mode.
   * @throws {InvalidStateError} If the player has been destroyed.
   */
  public setLoop(enabled: boolean): void {
    this.assertNotDestroyed();
    this.state.loop = enabled;
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

    this.stopInternal(true, false);

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
    inputArgs: readonly string[],
    outputArgs: readonly string[],
  ): { process: ChildProcess; resource: AudioResource } {
    const args: string[] = [
      ...inputArgs,
      "-i", url,
      "-analyzeduration", "0",
      "-loglevel", "error",
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "2",
      ...outputArgs,
      "pipe:1",
    ];

    const ffmpegProcess = spawn(this.options.ffmpeg.path, args, {
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
      inlineVolume: true,
    });

    // Set the initial volume via inline volume transformer
    resource.volume?.setVolume(volume / 100);

    return { process: ffmpegProcess, resource };
  }

  /**
   * Kills the current FFmpeg process if it exists.
   */
  private killFFmpeg(): void {
    if (this.state.ffmpegProcess) {
      const proc = this.state.ffmpegProcess;
      this.state.ffmpegProcess = null;

      try {
        proc.removeAllListeners();
        proc.stderr?.removeAllListeners();

        if (!proc.killed) {
          proc.kill("SIGKILL");
        }
      } catch {
        // Process may already be dead
      }
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
      guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: this.options.selfDeaf,
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
      const oldPlayer = this.state.player;
      this.state.player = null;
      oldPlayer.stop(true);
      oldPlayer.removeAllListeners();
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
      this.stopInternal(this.options.autoLeave, false);
    });

    player.on(AudioPlayerStatus.Idle, () => {
      // Playback finished naturally
      if (
        this.state.status === PlayerStatus.Playing ||
        this.state.status === PlayerStatus.Paused
      ) {
        this.handlePlaybackFinished();
      }
    });

    return player;
  }

  /**
   * Handles natural playback completion — emits `finish`, and either
   * loops the stream or stops playback.
   */
  private handlePlaybackFinished(): void {
    const finishedUrl = this.state.currentUrl;

    // Emit finish event for natural end
    if (finishedUrl !== null) {
      this.emit("finish", finishedUrl);
    }

    // If loop is enabled and we have the necessary state, restart playback
    if (this.state.loop && finishedUrl !== null && this.state.player && this.state.connection) {
      this.state.loopCount++;
      this.emit("loop", finishedUrl, this.state.loopCount);

      // Kill old FFmpeg and spawn a new one
      this.killFFmpeg();

      try {
        const { process: ffmpegProcess, resource } = this.spawnFFmpeg(
          finishedUrl,
          this.state.volume,
          this.options.ffmpeg.inputArgs,
          this.options.ffmpeg.outputArgs,
        );

        this.state.ffmpegProcess = ffmpegProcess;
        this.state.resource = resource;
        this.state.playbackStartedAt = Date.now();
        this.state.pausedAt = null;
        this.state.totalPausedDuration = 0;
        this.state.player.play(resource);
      } catch (error) {
        const wrappedError = new PlaybackError(
          `Failed to restart looped playback: ${error instanceof Error ? error.message : String(error)}`,
        );
        this.emit("error", wrappedError);
        this.stopInternal(this.options.autoLeave, false);
      }
      return;
    }

    // No loop — stop normally (isNaturalEnd=true but finish already emitted above)
    this.stopInternal(this.options.autoLeave, false);
  }

  /**
   * Internal stop implementation.
   *
   * @param shouldLeave - Whether to disconnect from the voice channel.
   * @param isNaturalEnd - Whether the stop was triggered by natural playback end.
   */
  private stopInternal(shouldLeave: boolean, _isNaturalEnd: boolean): void {
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

    // Clean up the resource and playback tracking
    this.state.resource = null;
    this.state.currentUrl = null;
    this.state.playbackStartedAt = null;
    this.state.pausedAt = null;
    this.state.totalPausedDuration = 0;
    this.state.loopCount = 0;

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
    this.state.playbackStartedAt = null;
    this.state.pausedAt = null;
    this.state.totalPausedDuration = 0;
    this.state.loopCount = 0;

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
