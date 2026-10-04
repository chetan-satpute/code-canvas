import clsx, { type ClassValue } from 'clsx';

export type { ClassValue };

// The app's only clsx import. Building every className through cn keeps the
// conditional-classname helper replaceable in one place.
const cn = clsx;

export default cn;
