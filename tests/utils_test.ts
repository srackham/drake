import { glob, sh } from "../lib/utils.ts";
import { assertEquals, test } from "./deps.ts";

test({
  name: "glob",
  fn() {
    const files = glob("mod.ts");
    assertEquals(files.length, 1);
    assertEquals(files[0], "mod.ts");
  }
});

test({
  name: "sh",
  async fn() {
    await sh("echo Hello");
  }
});
