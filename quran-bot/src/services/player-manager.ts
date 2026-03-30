import { RadioPlayer } from "discord-radio";
import type { VoiceBasedChannel } from "discord.js";
import { buildAudioUrl, DEFAULT_RECITER, type Reciter } from "../data/reciters.js";
import type { Surah } from "../data/surahs.js";

export interface GuildPlayerState {
  player: RadioPlayer;
  currentSurah: Surah | null;
  currentReciter: Reciter;
}

/**
 * Manages RadioPlayer instances per guild.
 * Ensures one player per guild and tracks current surah/reciter state.
 */
class PlayerManager {
  private readonly players = new Map<string, GuildPlayerState>();

  /**
   * Gets or creates a player state for a guild.
   */
  public getOrCreate(guildId: string): GuildPlayerState {
    let state = this.players.get(guildId);
    if (!state) {
      const player = new RadioPlayer({
        volume: 100,
        autoLeave: true,
      });

      player.on("error", (error) => {
        console.error(`[PlayerManager] Guild ${guildId} error:`, error.message);
      });

      player.on("disconnect", () => {
        this.cleanup(guildId);
      });

      state = {
        player,
        currentSurah: null,
        currentReciter: DEFAULT_RECITER,
      };
      this.players.set(guildId, state);
    }
    return state;
  }

  /**
   * Gets the existing player state for a guild, or null.
   */
  public get(guildId: string): GuildPlayerState | null {
    return this.players.get(guildId) ?? null;
  }

  /**
   * Plays a surah with the given reciter in a voice channel.
   */
  public async play(
    guildId: string,
    channel: VoiceBasedChannel,
    surah: Surah,
    reciter: Reciter,
    volume?: number,
  ): Promise<void> {
    const state = this.getOrCreate(guildId);
    const url = buildAudioUrl(reciter, surah.id);

    state.currentSurah = surah;
    state.currentReciter = reciter;

    await state.player.play(channel, url, volume !== undefined ? { volume } : undefined);
  }

  /**
   * Stops playback for a guild.
   */
  public stop(guildId: string): boolean {
    const state = this.players.get(guildId);
    if (!state) return false;

    state.player.stop();
    state.currentSurah = null;
    return true;
  }

  /**
   * Pauses playback for a guild.
   */
  public pause(guildId: string): boolean {
    const state = this.players.get(guildId);
    if (!state) return false;
    return state.player.pause();
  }

  /**
   * Resumes playback for a guild.
   */
  public resume(guildId: string): boolean {
    const state = this.players.get(guildId);
    if (!state) return false;
    return state.player.resume();
  }

  /**
   * Sets volume for a guild.
   */
  public setVolume(guildId: string, level: number): boolean {
    const state = this.players.get(guildId);
    if (!state) return false;
    state.player.setVolume(level);
    return true;
  }

  /**
   * Cleans up player state for a guild.
   */
  private cleanup(guildId: string): void {
    const state = this.players.get(guildId);
    if (state) {
      state.currentSurah = null;
      // Don't destroy - let it be reused
    }
  }

  /**
   * Destroys a guild's player completely.
   */
  public destroy(guildId: string): void {
    const state = this.players.get(guildId);
    if (state) {
      state.player.destroy();
      this.players.delete(guildId);
    }
  }

  /**
   * Destroys all players (for graceful shutdown).
   */
  public destroyAll(): void {
    for (const [guildId] of this.players) {
      this.destroy(guildId);
    }
  }
}

/** Singleton player manager instance. */
export const playerManager = new PlayerManager();
