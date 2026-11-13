class AppError extends Error {
  constructor(status, code, message, cause) {
    super(message, { cause });
    this.status = status;
    this.code = code;
    this.publicMessage = message;
  }
}

module.exports = AppError;
