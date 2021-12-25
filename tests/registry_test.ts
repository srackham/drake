import { env } from "../lib/env.ts";
import { desc, execute, run, task } from "../lib/registry.ts";
import { DrakeError, readFile, vers, writeFile } from "../lib/utils.ts";
import { assert, assertEquals, assertRejects, existsSync } from "./deps.ts";
env("--quiet", true);

Deno.test("registryTest", async function () {
  const tmpDir = Deno.makeTempDirSync();
  const savedCwd = Deno.cwd();
  try {
    env("--directory", tmpDir);

    const dir = env("--directory");
    env("--directory", ".");
    assertEquals(
      env("--directory"),
      dir,
    );

    await assertRejects(
      async () => await run("missing-normal-task"),
      DrakeError,
      "missing task:",
      "normal task passed to `run` API must exist",
    );

    await assertRejects(
      async () => await run("./missing-file-task"),
      DrakeError,
      "missing task:",
      "file task passed to `run` API must exist",
    );

    desc("Test task one");
    task("task1", []);

    const prereq = "./prerequisite-file";
    const target = "./target-file";
    const normalTask = "normalTask";
    let signature = "";

    assertEquals(task("task1").name, "task1");
    assertEquals(task("task1").desc, "Test task one");

    desc("File task");
    task(target, [prereq], function () {
      signature += target;
      writeFile(target, "");
    });

    desc("Normal task");
    task(normalTask, [prereq], () => signature += normalTask);

    await assertRejects(
      async () => await run(target),
      DrakeError,
      "missing prerequisite file:",
      "prerequisite files should exist when file task executes",
    );

    writeFile(prereq, "");
    await run(target);
    assert(
      existsSync("./.drake.cache.json"),
      "drake cache should have been created",
    );
    const cache = JSON.parse(readFile("./.drake.cache.json"));
    assertEquals(cache.version, vers());
    assertEquals(cache.os, Deno.build.os);

    await assertRejects(
      async () => await run(normalTask),
      DrakeError,
      `${normalTask}: missing prerequisite task: `,
      "missing prerequisite file task should throw error in a normal task",
    );

    task(prereq, []);
    await run(normalTask), // Should now run OK.
      task(normalTask).prereqs = ["missing-task"];
    await assertRejects(
      async () => await run(normalTask),
      DrakeError,
      `${normalTask}: missing prerequisite task: missing-task`,
      "missing task should throw error",
    );

    task("missing-task", []);
    await run(normalTask); // Should now run OK.

    task(target).prereqs.push(normalTask);
    await run(target); // Normal prerequisites do not throw a "missing prerequisite" error.

    await assertRejects(
      async () => await execute(normalTask),
      DrakeError,
      "'execute' API must be called by 'run' API",
    );

    signature = "";
    Deno.removeSync(target);
    task("exec", [], async () => await execute(normalTask, normalTask, target));
    await run("exec");
    assertEquals(
      signature,
      normalTask + normalTask + target,
      "'execute' API should should execute serially",
    );

    signature = "";
    await run("exec");
    assertEquals(
      signature,
      normalTask + normalTask,
      "'execute' API should skip up to date task actions",
    );

    let counter = 0;
    // deno-lint-ignore require-await
    task("async", [], async () => counter += 1);
    task(
      "execAsync",
      [],
      async () => await execute(...Array(10).fill("async")),
    );
    await run("execAsync");
    assertEquals(
      counter,
      10,
      "'execute' API should run async task actions 10 times",
    );
  } finally {
    env("--directory", savedCwd);
    Deno.removeSync(tmpDir, { recursive: true });
  }
});
