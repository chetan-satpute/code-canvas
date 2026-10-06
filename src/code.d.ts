// Both modules are produced by the Vite plugin in `vite/codeHighlight.ts`.
// The types are pulled in with inline `import()` rather than a top-level
// import, because a file with top-level imports can only augment modules that
// already exist, not declare new ones.

declare module '*.md?highlight' {
  const listing: import('#utils/code.ts').Listing;

  export default listing;
}

declare module 'virtual:code-theme' {
  export const palette: import('#utils/code.ts').CodePalette;
}
