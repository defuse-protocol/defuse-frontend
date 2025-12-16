import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes"
import type { Metadata, NextPage } from "next"
import Image from "next/image"

import PageBackground from "@src/components/PageBackground"
import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"

export const metadata: Metadata = {
  title: "Site Maintenance",
}

const MaintenancePage: NextPage = async () => {
  const templ = await whitelabelTemplateFlag()

  return (
    <Box className="min-h-screen flex items-center justify-center relative">
      <PreloadFeatureFlags>
        <PageBackground />
      </PreloadFeatureFlags>

      <Container size="1" className="flex-1 max-w-[440px] mx-4 md:mx-auto">
        <Flex
          direction="column"
          gap="5"
          align="center"
          className="bg-gray-1 rounded-[16px] md:rounded-[24px] shadow-paper dark:shadow-paper-dark p-5 md:p-8"
        >
          <Heading
            as="h1"
            size={{ initial: "7", md: "8" }}
            weight="bold"
            className="text-gray-11"
          >
            Site Maintenance
          </Heading>

          <Text
            size={{ initial: "2", md: "3" }}
            weight="medium"
            className="text-gray-11"
          >
            We're currently performing maintenance on our site. Please check
            back soon.
          </Text>

          <Image
            src={`/favicons/${templ}/apple-touch-icon.png`}
            alt="Site Logo"
            width={60}
            height={60}
            className="rounded-xl"
          />
        </Flex>
      </Container>
    </Box>
  )
}

export default MaintenancePage
