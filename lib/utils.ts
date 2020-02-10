import { walkSync } from "https://deno.land/std/fs/mod.ts";
import { globToRegExp } from "https://deno.land/std/path/mod.ts";

// Return array of file names matching the glob patterns relative to the cwd.
// e.g. glob("tmp/*.ts", "lib/*.ts", "mod.ts");
export function glob(...patterns: string[]): string[] {
  let regexps = patterns.map(pat => globToRegExp(pat));
  let iter = walkSync(".", { match: regexps, includeDirs: false });
  return Array.from(iter, info => info.filename);
}

// Execute shell commands sequentially.
export async function exec(args: string[]) {
  // create subprocess
  const p = Deno.run({
    args: args,
    stdout: "piped"
  });
  const { code } = await p.status();
  const output = new TextDecoder().decode(await p.output());
  return { code, output };
}
