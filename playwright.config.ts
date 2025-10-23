import type { GitHubActionOptions } from "@estruyf/github-actions-reporter"
import { defineConfig, devices } from "@playwright/test"
// import assert from 'node:assert';
// import {Block, KnownBlock} from '@slack/types';
// import {SummaryResults} from 'playwright-slack-report/dist/src';
// import * as tags from './test/helpers/constants/tags';

export default defineConfig({
  testDir: "./test",
  fullyParallel: false,
  forbidOnly: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        ["html", { outputFolder: "my-report", open: "never" }],
        ["junit", { outputFile: "results.xml", open: "never" }],
        [
          "@estruyf/github-actions-reporter",
          <GitHubActionOptions>{
            useDetails: true,
            showError: false,
            showTags: false,
          },
        ],
        // [
        //   "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
        //   {
        //     slackWebHookUrl: process.env.SLACK_WEBHOOK_URL,
        //     layout: generateCustomLayoutSimpleMeta,
        //     meta: [{ key: "Product", value: `${process.env.RUN_TAG}` }],
        //     sendResults:
        //       process.env.MANUAL_TRIGGER === "true" ? "off" : "always",
        //   },
        // ],
      ]
    : [["dot"], ["list"], ["html"]],
  reportSlowTests: null,
  timeout: (process.env.CI ? 3 : 2) * 60 * 1000,
  globalTimeout: (process.env.CI ? 60 : 30) * 60 * 1000,
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1920, height: 1080 },
  },
  expect: {
    timeout: 50 * 1000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: process.env.CI
            ? [
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
                "--no-sandbox",
                "--disable-setuid-sandbox",
              ]
            : [],
        },
      },
    },
  ],
})

// We can later re-enable the slack reporter and other reporters if we want to

// function generateCustomLayoutSimpleMeta(
//   summaryResults: SummaryResults
// ): Array<Block | KnownBlock> {
//   let header = {
//     type: "section",
//     text: {
//       type: "mrkdwn",
//       text: "🎭 Playwright Results",
//     },
//   }

//   if (summaryResults.meta) {
//     const foundValue = summaryResults.meta.find(
//       (pair) => pair.key === "Product"
//     )

//     assert(foundValue !== undefined)

//     const product = getProductFromTag(foundValue.value)

//     header = {
//       type: "section",
//       text: {
//         type: "mrkdwn",
//         text: `🎭 Playwright Results - *${product}*`,
//       },
//     }
//   }

//   const summary = {
//     type: "section",
//     text: {
//       type: "mrkdwn",
//       text: `✅ *${summaryResults.passed}* | ❌ *${summaryResults.failed}* |${
//         summaryResults.flaky !== undefined
//           ? ` 🟡 *${summaryResults.flaky}* | `
//           : " "
//       }⏩ *${summaryResults.skipped}*`,
//     },
//   }

//   const fails = generateFailures(summaryResults, 10)

//   return [header, summary, ...fails]
// }

// function getProductFromTag(tagName: string): string {
//   switch (tagName) {
//     case tags.NEAR_INTENTS_TAG:
//       return "Near-Intents"
//     case tags.NEAR_INTENTS_TAG_SWAP:
//       return "Near-Intents Swapping"
//     case tags.NEAR_INTENTS_TAG_OTC:
//       return "Near-Intents OTC Trade"
//     case tags.NEAR_INTENTS_TAG_DEPOSIT:
//       return "Near-Intents Depositing"
//     case tags.NEAR_INTENTS_TAG_WITHDRAW:
//       return "Near-Intents Witdrawing"
//     default:
//       return "All products - Near3 & Aurora+"
//   }
// }

// const generateFailures = (
//   summaryResults: SummaryResults,
//   maxNumberOfFailures: number
// ): Array<KnownBlock | Block> => {
//   const maxNumberOfFailureLength = 650
//   const fails = []

//   const numberOfFailuresToShow = Math.min(
//     summaryResults.failures.length,
//     maxNumberOfFailures
//   )

//   for (let i = 0; i < numberOfFailuresToShow; i += 1) {
//     const { failureReason, test, suite } = summaryResults.failures[i]
//     const formattedFailure = failureReason
//       .substring(0, maxNumberOfFailureLength)
//       .split("\n")
//       .map((l: string) => `>${l}`)
//       .join("\n")
//     fails.push({
//       type: "section",
//       text: {
//         type: "mrkdwn",
//         text: `*${suite} > ${test}*
//         \n${formattedFailure}`,
//       },
//     })
//   }

//   if (
//     maxNumberOfFailures > 0 &&
//     summaryResults.failures.length > maxNumberOfFailures
//   ) {
//     fails.push({
//       type: "section",
//       text: {
//         type: "mrkdwn",
//         text: `*⚠️ There are too many failures to display - ${fails.length} out of ${summaryResults.failures.length} failures shown*`,
//       },
//     })
//   }

//   if (fails.length === 0) {
//     return []
//   }

//   return [
//     {
//       type: "divider",
//     },
//     ...fails,
//   ]
// }
