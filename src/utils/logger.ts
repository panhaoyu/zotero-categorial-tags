class Logger {
  debug(message: string) {
    Zotero.debug(message);
  }

  info(message: string) {
    Zotero.log(message);
  }
}

export const logger = new Logger();