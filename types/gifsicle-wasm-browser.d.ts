/**
 * Minimal type declarations for gifsicle-wasm-browser.
 *
 * The package ships without TypeScript types. These declarations cover
 * only the API surface we use (gifsicle.run) so that our composable
 * compiles cleanly under strict mode.
 *
 * @see https://github.com/renzhezhilu/gifsicle-wasm-browser
 */
declare module 'gifsicle-wasm-browser' {
  interface GifsicleInput {
    /** GIF source: a URL string, File, Blob, or ArrayBuffer */
    file: string | File | Blob | ArrayBuffer
    /** Filename used to reference this input inside `command` strings */
    name: string
  }

  interface GifsicleRunOptions {
    /** Array of input GIF files */
    input: GifsicleInput[]
    /** Array of gifsicle command strings to execute sequentially */
    command: string[]
    /** Optional folder names available in commands (default: /, /out, /tem) */
    folder?: string[]
    /** End immediately on error or warning (default: false) */
    isStrict?: boolean
  }

  interface Gifsicle {
    /** Run gifsicle commands and return output File objects from /out/ */
    run(options: GifsicleRunOptions): Promise<File[]>
  }

  const gifsicle: Gifsicle
  export default gifsicle
}
