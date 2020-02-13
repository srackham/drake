export { sh, glob, exec };

import { walkSync } from "https://deno.land/std@v0.32.0/fs/mod.ts";
import { globToRegExp } from "https://deno.land/std@v0.32.0/path/mod.ts";
import { log } from "../mod.ts";

// Return array of file names matching the glob patterns relative to the cwd.
// e.g. glob("tmp/*.ts", "lib/*.ts", "mod.ts");
function glob(...patterns: string[]): string[] {
  const regexps = patterns.map(pat => globToRegExp(pat));
  const iter = walkSync(".", { match: regexps, includeDirs: false });
  return Array.from(iter, info => info.filename);
}

// Execute process.
async function exec(args: string[]) {
  log(`exec: ${args}`);
  // create subprocess
  const p = Deno.run({
    args: args,
    // stdout: "piped"
    stdout: "inherit"
  });
  const { code } = await p.status();
  // const output = new TextDecoder().decode(await p.output());
  if (code !== 0) {
    throw new Error(`error code: ${code}: ${args}`);
  }
  // return { code, output };
  return { code };
}

// Execute shell command.
async function sh(cmd: string) {
  log(`sh: ${cmd}`);
  let args: string[];
  if (Deno.build.os === "win") {
    args = [Deno.env("COMSPEC"), "/C", cmd];
  } else {
    args = [Deno.env("SHELL"), "-c", cmd];
  }
  // create subprocess
  const p = Deno.run({
    args: args,
    stdout: "inherit"
  });
  const { code } = await p.status();
  if (code !== 0) {
    throw new Error(`sh: ${cmd}: error code: ${code}`);
  }
}
