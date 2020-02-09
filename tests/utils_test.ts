// const { mkdirSync } = Deno;
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { runIfMain, test } from "https://deno.land/std/testing/mod.ts";
import { glob } from "../lib/utils.ts";

// mkdirSync('zzz')

test({
  name: "glob",
  fn(): void {
    let files = glob("mod.ts");
    assertEquals(files.length, 1);
  }
});

runIfMain(import.meta);
