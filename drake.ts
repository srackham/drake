// A thin CLI wrapper for the Drake library module.

import { existsSync } from "https://deno.land/std@v0.33.0/fs/mod.ts";
import * as path from "https://deno.land/std@v0.33.0/path/mod.ts";
import { help } from "./lib/help.ts";
import { abort } from "./lib/utils.ts";
import { env, vers } from "./mod.ts";

if (env["--help"]) {
  help();
} else if (env["--version"]) {
  console.log(vers);
} else {
  let drakefile = env["--drakefile"] ? env["--drakefile"] : "./Drakefile.ts";
  if (!existsSync(drakefile) || !Deno.statSync(drakefile).isFile()) {
    abort(`--drakefile missing or not a regular file: ${drakefile}`);
  }
  if (env["--directory"]) {
    const dir = env["--directory"];
    if (!existsSync(dir) || !Deno.statSync(dir).isDirectory()) {
      abort(`--directory missing or not a directory: ${dir}`);
    }
    Deno.chdir(dir);
  }
  if (!path.isAbsolute(drakefile)) {
    drakefile = path.join(Deno.cwd(), drakefile);
  }
  import(drakefile);
}
