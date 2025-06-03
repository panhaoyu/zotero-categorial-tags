class Logger {
  private readonly console: Console;

  constructor() {
    this.console = Zotero.getMainWindow()?.console;
  }

  debug(message: string) {
    this.console.debug(message);
  }

  info(message: string) {
    this.console.info(message);
  }
}

export const logger = new Logger();