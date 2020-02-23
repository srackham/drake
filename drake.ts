// A thin CLI wrapper for the Drake library module.

import { existsSync } from "https://deno.land/std@v0.33.0/fs/mod.ts";
import { abort, env } from "./mod.ts";

if (!env["--help"] && !env["--version"]) {
  const drakefile = env["--drakefile"];
  if (!existsSync(drakefile) || !Deno.statSync(drakefile).isFile()) {
    abort(`--drakefile missing or not a regular file: ${drakefile}`);
  }
  import(env["--drakefile"]);
}
