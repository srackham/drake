import { assertEquals } from "https://deno.land/std@v0.41.0/testing/asserts.ts";
import { desc, env, task } from "../mod.ts";

env("--abort-exits", false);

Deno.test(
  function drakeApiTest() {
    desc("Test task one");
    task("task1", []);
    const task1 = task("task1");
    assertEquals(task1.name, "task1");
    assertEquals(task1.desc, "Test task one");
  },
);
