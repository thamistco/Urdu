/** A bundled font file: the bundler hands back an asset id, which expo-font loads. */
declare module '*.ttf' {
  const font: number;
  export default font;
}
