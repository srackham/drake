import { assertEquals } from "https://deno.land/std@v0.33.0/testing/asserts.ts";
import { glob, sh } from "../lib/utils.ts";

Deno.test(
  function globTest() {
    const files = glob("mod.ts");
    assertEquals(files.length, 1);
    assertEquals(files[0], "mod.ts");
  }
);

Deno.test(
  async function shTest() {
    await sh("echo Hello");
  }
);

await Deno.runTests();
