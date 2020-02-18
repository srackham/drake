import { assertEquals } from "https://deno.land/std@v0.33.0/testing/asserts.ts";
import { glob, sh } from "../lib/utils.ts";

Deno.test(
  function globTest() {
    let files = glob("mod.ts");
    assertEquals(files.length, 1);
    assertEquals(files[0], "./mod.ts");
    files = glob("./lib/*.ts");
    assertEquals(
      files.sort().toString(),
      ["./lib/tasks.ts", "./lib/help.ts", "./lib/utils.ts", "./lib/cli.ts"]
        .sort()
        .toString()
    );
  }
);

Deno.test(
  async function shTest() {
    await sh("echo Hello");
  }
);

await Deno.runTests();
