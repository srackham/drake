import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { test } from "https://deno.land/std/testing/mod.ts";
import { exec, glob } from "../lib/utils.ts";

test({
  name: "glob",
  fn() {
    let files = glob("mod.ts");
    assertEquals(files.length, 1);
    assertEquals(files[0], "mod.ts");
  }
});

test({
  name: "exec",
  async fn() {
    let { code, output } = await exec(["echo", "Hello"]);
    assertEquals(code, 0);
    assertEquals(output, "Hello\n");
  }
});
