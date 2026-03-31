/**
 * discord-radio
 *
 * A minimal, flexible audio stream player for Discord voice channels.
 * Uses FFmpeg (spawn) for robust audio processing.
 *
 * @packageDocumentation
 */

export { RadioPlayer } from "./player.js";

export {
  PlayerStatus,
  type FFmpegOptions,
  type RadioPlayerOptions,
  type PlayOptions,
  type PlayerState,
  type RadioPlayerEvents,
} from "./types.js";

export {
  RadioPlayerError,
  InvalidStateError,
  ConnectionError,
  ValidationError,
  PlaybackError,
  FFmpegError,
} from "./errors.js";
