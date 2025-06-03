class Logger {
  debug(message: string) {
    console.debug(message);
    Zotero.debug(message);
  }

  info(message: string) {
    console.info(message);
    Zotero.log(message);
  }
}

export const logger = new Logger();