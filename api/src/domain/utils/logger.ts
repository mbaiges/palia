const getTimestamp = (): string => new Date().toISOString();

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${getTimestamp()}: ${message}`, ...args);
  },
  error: (message: string, error?: any, ...args: any[]) => {
    const logMessage = `[ERROR] ${getTimestamp()}: ${message}`;
    if (error) {
      console.error(logMessage, ...args, '\n', error);
    } else {
      console.error(logMessage, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${getTimestamp()}: ${message}`, ...args);
    }
  },
};
