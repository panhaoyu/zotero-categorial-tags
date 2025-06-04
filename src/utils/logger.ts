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

  warn(message: string) {
    this.console.warn(message);
  }

  error(message: string) {
    this.console.error(message);
  }

  log(message: string) {
    this.console.log(message);
  }
}

export const logger = new Logger();