// A thin CLI wrapper for the Drake library module.

import { existsSync } from "https://deno.land/std@v0.33.0/fs/mod.ts";
import { help } from "./lib/help.ts";
import { env, vers } from "./mod.ts";

const drakefile = env["--drakefile"] ? env["--drakefile"] : "./Drakefile.ts";
if (env["--help"]) {
  help();
} else if (env["--version"]) {
  console.log(vers);
} else {
  if (!existsSync(drakefile)) {
    throw new Error(`missing drakefile: ${drakefile}`);
  }
  import(drakefile);
}
