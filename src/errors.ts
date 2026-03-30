/**
 * Base error class for all RadioPlayer errors.
 */
export class RadioPlayerError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "RadioPlayerError";
    this.code = code;
  }
}

/**
 * Thrown when attempting an operation while the player is in an invalid state.
 */
export class InvalidStateError extends RadioPlayerError {
  constructor(message: string) {
    super(message, "INVALID_STATE");
    this.name = "InvalidStateError";
  }
}

/**
 * Thrown when the voice connection fails or times out.
 */
export class ConnectionError extends RadioPlayerError {
  constructor(message: string) {
    super(message, "CONNECTION_ERROR");
    this.name = "ConnectionError";
  }
}

/**
 * Thrown when an invalid argument is provided.
 */
export class ValidationError extends RadioPlayerError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * Thrown when audio stream creation or playback fails.
 */
export class PlaybackError extends RadioPlayerError {
  constructor(message: string) {
    super(message, "PLAYBACK_ERROR");
    this.name = "PlaybackError";
  }
}

/**
 * Thrown when FFmpeg process fails.
 */
export class FFmpegError extends RadioPlayerError {
  constructor(message: string) {
    super(message, "FFMPEG_ERROR");
    this.name = "FFmpegError";
  }
}
