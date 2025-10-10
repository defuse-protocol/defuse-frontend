import { $ } from "bun"

await $`bunx --headless -f`.quiet().nothrow()
let synpressResult = await $`bunx --headless`.quiet().nothrow()

if (synpressResult.exitCode !== 0) {
  await $`bunx playwright install chromium`
  await $`bunx synpress --headless -f`
  synpressResult = await $`bunx synpress --headless`.quiet().nothrow()
}

const synpressHash = synpressResult.stdout
  .toString()
  .match(/Cache already exists for ([^.]+)\./)?.[1]

if (!synpressHash) {
  throw new Error(
    `Could not extract synpress cache hash from test output: ${synpressResult.stdout.toString()}`
  )
}

const testResult =
  await $`bunx playwright test --workers=1 --grep 'Check synpress' --reporter=line`
    .quiet()
    .nothrow()

if (testResult.exitCode === 0) {
  process.exit(0)
}

const playwrightHash = testResult.stdout
  .toString()
  .match(/Cache for (.+) does not exist/)?.[1]

if (!playwrightHash) {
  throw new Error(
    `Could not extract synpress cache hash from test output. Fix the test:\n\n${testResult.stderr.toString()}\n\n${testResult.stdout.toString()}`
  )
}

await $`cp -r ./.cache-synpress/${synpressHash} ./.cache-synpress/${playwrightHash}`
