import { walkSync } from "https://deno.land/std/fs/mod.ts"
import { globToRegExp } from "https://deno.land/std/path/mod.ts"

// Return array of file names matching the glob pattern relative to the cwd.
export function glob(pattern: string, options?): string[] {
  let regex = globToRegExp(pattern);
  let iter = walkSync(".", { match: [regex] });
  return Array.from(iter, info => info.filename);
}

let files = glob("**/*.ts");
console.log(files);
