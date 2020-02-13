import { exec, glob, sh } from "../lib/utils.ts";
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
  name: "exec",
  async fn() {
    // const { code, output } = await exec(["echo", "Hello"]);
    const { code } = await exec(["echo", "Hello"]);
    assertEquals(code, 0);
    // assertEquals(output, "Hello\n");
  }
});

test({
  name: "sh",
  async fn() {
    await sh("echo Hello");
  }
});
