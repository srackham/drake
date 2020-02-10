export { run };

import { opts } from "./cli.ts";
import { manpage, vers } from "./manpage.ts";

function run(): void {
  if (opts.help) {
    console.log(`${manpage}\n`);
    Deno.exit();
  } else if (opts.vers) {
    console.log(vers);
    Deno.exit();
  }
}
