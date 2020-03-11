import {
  assertEquals
} from "https://deno.land/std@v0.35.0/testing/asserts.ts";
import { env, shCapture, vers } from "../mod.ts";

env["--abort-exits"] = false;

Deno.test(
  async function cliTest() {
    const drake = "deno run -A drake.ts";
    const { stdout } = await shCapture(`${drake} --version`);
    assertEquals(stdout.trimRight(), vers);
  }
);
