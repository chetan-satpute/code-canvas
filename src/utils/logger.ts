// Every console call in the app goes through here, so app output is always
// distinguishable from a library's in a shared console.
const prefix = '[code-canvas]';

const logger = {
  error: (message: string, ...details: unknown[]) => {
    console.error(prefix, message, ...details);
  },
  warn: (message: string, ...details: unknown[]) => {
    console.warn(prefix, message, ...details);
  },
  info: (message: string, ...details: unknown[]) => {
    console.info(prefix, message, ...details);
  },
};

export default logger;
