import {
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std@v0.41.0/testing/asserts.ts";
import { touch } from "../lib/utils.ts";
import { desc, DrakeError, env, run, task } from "../mod.ts";

env("--abort-exits", false);

Deno.test(
  async function drakeApiTest() {
    const dir = Deno.makeTempDirSync();
    const savedCwd = Deno.cwd();
    try {
      Deno.chdir(dir);

      desc("Test task one");
      task("task1", []);

      const prereqFile = "./prerequisite-file";
      const targetFile = "./target-file";

      let t = task("task1");
      assertEquals(t.name, "task1");
      assertEquals(t.desc, "Test task one");

      desc("File task");
      task(targetFile, [prereqFile]);

      desc("Normal task");
      task("normalTask", [prereqFile]);

      await assertThrowsAsync(
        async () => await run(targetFile),
        DrakeError,
        "missing prerequisite file:",
        "prerequisite files should exist when file task executes",
      );

      await assertThrowsAsync(
        async () => await run("normalTask"),
        DrakeError,
        "missing prerequisite file:",
        "prerequisite files should exist when normal task executes",
      );

      touch(prereqFile);

      run(prereqFile);

      await assertThrowsAsync(
        async () => await run("normalTask"),
        DrakeError,
        "no matching task for prerequisite file:",
        "missing prerequisite file task should throw error in a normal task",
      );
    } finally {
      Deno.chdir(savedCwd);
      Deno.removeSync(dir, { recursive: true });
    }
  },
);
