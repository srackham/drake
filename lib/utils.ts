export { sh, glob };

import { walkSync } from "https://deno.land/std@v0.33.0/fs/mod.ts";
import { globToRegExp } from "https://deno.land/std@v0.33.0/path/mod.ts";

// Return array of file names matching the glob patterns relative to the cwd.
// e.g. glob("tmp/*.ts", "lib/*.ts", "mod.ts");
function glob(...patterns: string[]): string[] {
  const regexps = patterns.map(pat => globToRegExp(pat));
  const iter = walkSync(".", { match: regexps, includeDirs: false });
  return Array.from(iter, info => info.filename);
}

// Start shell command and return status promise.
function launch(cmd: string): Promise<Deno.ProcessStatus> {
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
  return p.status();
}

// Execute shell commands.
// If 'cmds` is a string execute it in the command shell.
// If 'cmds` is a string array execute each command in parallel.
// If any command fails throw and error.
async function sh(cmds: string | string[]) {
  let cmd: string;
  let code: number;
  if (typeof cmds === "string") {
    cmd = cmds;
    code = (await launch(cmds)).code;
  } else {
    const promises = [];
    for (const cmd of cmds) {
      promises.push(launch(cmd));
    }
    const results = await Promise.all(promises);
    for (const i in results) {
      cmd = cmds[i];
      code = results[i].code;
      if (code !== 0) {
        break;
      }
    }
  }
  if (code !== 0) {
    throw new Error(`sh: ${cmd}: error code: ${code}`);
  }
}
