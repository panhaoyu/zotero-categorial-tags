/**
 * 输出日志到 Zotero 主窗口的控制台。
 */
class Logger {
  private get target(): Console {
    return Zotero.getMainWindow()?.console ?? globalThis.console;
  }

  debug(message: string): void {
    this.target.debug(message);
  }

  info(message: string): void {
    this.target.info(message);
  }

  warn(message: string): void {
    this.target.warn(message);
  }

  error(message: string): void {
    this.target.error(message);
  }

  log(message: string): void {
    this.target.log(message);
  }
}

export const logger = new Logger();
