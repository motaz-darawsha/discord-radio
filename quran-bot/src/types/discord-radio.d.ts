declare module "discord-radio" {
  import type { VoiceBasedChannel } from "discord.js";
  import { EventEmitter } from "node:events";

  export enum PlayerStatus {
    Idle = "idle",
    Connecting = "connecting",
    Playing = "playing",
    Paused = "paused",
    Destroyed = "destroyed",
  }

  export interface RadioPlayerOptions {
    autoLeave?: boolean;
    volume?: number;
    connectionTimeout?: number;
    ffmpegPath?: string;
    ffmpegInputArgs?: string[];
    ffmpegOutputArgs?: string[];
  }

  export interface PlayOptions {
    volume?: number;
    ffmpegInputArgs?: string[];
    ffmpegOutputArgs?: string[];
  }

  export class RadioPlayerError extends Error {
    constructor(message: string);
  }

  export interface RadioPlayerEvents {
    play: [url: string];
    stop: [];
    pause: [];
    resume: [];
    volumeChange: [volume: number];
    error: [error: RadioPlayerError];
    statusChange: [oldStatus: PlayerStatus, newStatus: PlayerStatus];
    destroy: [];
    connect: [channel: VoiceBasedChannel];
    disconnect: [];
  }

  export class RadioPlayer extends EventEmitter {
    constructor(options?: RadioPlayerOptions);

    readonly status: PlayerStatus;
    readonly volume: number;
    readonly channel: VoiceBasedChannel | null;
    readonly connected: boolean;

    play(channel: VoiceBasedChannel, url: string, options?: PlayOptions): Promise<void>;
    stop(): void;
    pause(): boolean;
    resume(): boolean;
    setVolume(volume: number): void;
    destroy(): void;
    disconnect(): void;

    on<K extends keyof RadioPlayerEvents>(event: K, listener: (...args: RadioPlayerEvents[K]) => void): this;
    once<K extends keyof RadioPlayerEvents>(event: K, listener: (...args: RadioPlayerEvents[K]) => void): this;
    emit<K extends keyof RadioPlayerEvents>(event: K, ...args: RadioPlayerEvents[K]): boolean;
    off<K extends keyof RadioPlayerEvents>(event: K, listener: (...args: RadioPlayerEvents[K]) => void): this;
  }
}
