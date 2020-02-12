import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { test } from "https://deno.land/std/testing/mod.ts";
import { Env } from "../lib/cli.ts";
import { TaskRegistry } from "../lib/tasks.ts";

test({
  name: "resolveActions",
  fn() {
    const env: Env = {};
    const taskRegistry = new TaskRegistry(env);

    taskRegistry.desc("Task 1");
    taskRegistry.register("1", ["2", "3"], () => {});

    taskRegistry.desc("Task 2");
    taskRegistry.register("2", ["3"], () => {});

    taskRegistry.desc("Task 3");
    taskRegistry.register("3", [], () => {});

    assertEquals(taskRegistry.tasks["1"].desc, "Task 1");
    assertEquals(
      taskRegistry.resolveActions(["1", "3", "2"]),
      ["3", "2", "1"]
    );
  }
});
