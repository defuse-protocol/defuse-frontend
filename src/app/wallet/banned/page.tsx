import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons"
import { Box, Callout, Container, Flex, Heading, Text } from "@radix-ui/themes"
import type { Metadata } from "next"

import PageBackground from "@src/components/PageBackground"
import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"

export const metadata: Metadata = {
  title: "Wallet Address Blocked",
}

export default async function BannedWalletPage() {
  return (
    <Box className="min-h-screen flex items-center justify-center relative">
      <PreloadFeatureFlags>
        <PageBackground />
      </PreloadFeatureFlags>

      <Container size="1" className="flex-1 max-w-[500px] mx-4 md:mx-auto">
        <Flex
          direction="column"
          gap="5"
          align="center"
          className="bg-gray-1 rounded-[16px] md:rounded-[24px] shadow-paper dark:shadow-paper-dark p-5 md:p-8"
        >
          {/* Header Section */}
          <Flex
            direction="column"
            align="center"
            gap="4"
            className="text-center"
          >
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-full">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <Heading
              as="h1"
              size={{ initial: "6", md: "7" }}
              weight="bold"
              className="text-gray-900 dark:text-gray-100"
            >
              Wallet Address is Blocked
            </Heading>
            <Text size={{ initial: "2", md: "3" }} className="text-gray-11">
              For your safety, your wallet address is blocked from using this
              app.
            </Text>
          </Flex>

          {/* Info List */}
          <Box className="bg-gray-50 dark:bg-gray-800 text-gray-11 rounded-lg p-4 w-full">
            <Flex direction="column" gap="3">
              <Flex align="start" gap="3">
                <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-1 mt-0.5">
                  <MagnifyingGlassIcon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                <Text size="2" className="flex-1">
                  Wallet address is blocked from using this app
                </Text>
              </Flex>
            </Flex>
          </Box>

          {/* Warning Message */}
          <Callout.Root className="w-full bg-warning px-3 py-2 text-warning-foreground">
            <Callout.Text className="text-xs">
              Please use a different wallet to continue.
            </Callout.Text>
          </Callout.Root>
        </Flex>
      </Container>
    </Box>
  )
}
