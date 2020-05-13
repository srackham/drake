import { assertEquals, assertThrowsAsync } from "../deps.ts";
import { writeFile } from "../lib/utils.ts";
import { desc, DrakeError, env, run, task } from "../mod.ts";

env("--abort-exits", false);
env("--quiet", true);

Deno.test("apiTest", async function () {
  const dir = Deno.makeTempDirSync();
  const savedCwd = Deno.cwd();
  try {
    env("--directory", dir);

    await assertThrowsAsync(
      async () => await run("missing-normal-task"),
      DrakeError,
      "missing task:",
      "normal task passed to `run` API must exist",
    );

    await assertThrowsAsync(
      async () => await run("./missing-file-task"),
      DrakeError,
      "missing task:",
      "file task passed to `run` API must exist",
    );

    desc("Test task one");
    task("task1", []);

    const prereq = "./prerequisite-file";
    const target = "./target-file";

    let t = task("task1");
    assertEquals(t.name, "task1");
    assertEquals(t.desc, "Test task one");

    desc("File task");
    task(target, [prereq]);

    desc("Normal task");
    task("normalTask", [prereq]);

    await assertThrowsAsync(
      async () => await run(target),
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

    writeFile(prereq, "");
    run(target);

    await assertThrowsAsync(
      async () => await run("normalTask"),
      DrakeError,
      "no matching task for prerequisite file:",
      "missing prerequisite file task should throw error in a normal task",
    );
  } finally {
    env("--directory", savedCwd);
    Deno.removeSync(dir, { recursive: true });
  }
});
