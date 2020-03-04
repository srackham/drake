import {
  assertEquals,
  assertThrows,
  assertThrowsAsync
} from "https://deno.land/std@v0.35.0/testing/asserts.ts";
import { Env } from "../lib/cli.ts";
import { Task, TaskRegistry } from "../lib/tasks.ts";
import { DrakeError } from "../lib/utils.ts";

Deno.test(
  async function taskRegistryTests() {
    const env: Env = { "--tasks": [] };
    env["--quiet"] = true;
    const taskRegistry = new TaskRegistry(env);

    assertThrows(
      () => taskRegistry.get("quux"),
      DrakeError,
      "missing task: quux"
    );

    let log: string[] = [];
    const action = function(this: Task) {
      log.push(this.name);
    };

    taskRegistry.desc("Task 1");
    taskRegistry.register("1", ["2", "3"], action);

    taskRegistry.desc("Task 2");
    taskRegistry.register("2", ["3"], action);

    taskRegistry.desc("Task 3");
    taskRegistry.register("3", [], action);

    assertEquals(taskRegistry.get("1").desc, "Task 1");
    assertEquals(
      taskRegistry.resolveDependencies(["1", "3", "2"]).map(task => task.name),
      ["3", "2", "1"]
    );
    await taskRegistry.run("1", "2", "3");
    assertEquals(log, ["3", "2", "1"], "execution log mismatch");

    taskRegistry.desc("Task 4");
    taskRegistry.register("4", ["1", "4"], action);
    taskRegistry.get("2").prereqs.push("4");
    await assertThrowsAsync(
      async () => await taskRegistry.run("4"),
      DrakeError,
      "cyclic dependency between 4 and 1, cyclic dependency between 4 and 4",
      "cyclic dependency should throw error"
    );
  }
);
