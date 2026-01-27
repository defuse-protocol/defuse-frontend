import { settings } from "@src/config/settings"
import { NearIntentsLogoSymbolIcon } from "@src/icons"
import type { Metadata } from "next"

export const metadata: Metadata = settings.metadata.jobs

export const jobsData = [
  // {
  //   team: "BD",
  //   position: "VP of Business Development",
  //   link: "https://defuse.bamboohr.com/careers/23",
  // },
  // {
  //   team: "Marketing",
  //   position: "Head of Marketing",
  //   link: "https://defuse.bamboohr.com/careers/24",
  // },
  {
    team: "Infrastructure",
    position: "Senior Software Engineer (Rust)",
    link: "https://defuse.bamboohr.com/careers/25",
  },
  {
    team: "Frontend",
    position: "Senior Software Engineer (Frontend)",
    link: "https://defuse.bamboohr.com/careers/26",
  },
]

export default function JobsPage() {
  return (
    <div className="bg-white flex flex-col items-center px-4 flex-1 py-12">
      <div className="max-w-3xl w-full flex flex-col items-center justify-center">
        <NearIntentsLogoSymbolIcon className="size-10 shrink-0" />
        <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-gray-900 text-center">
          Work with us
        </h1>
        <p className="text-gray-500 mt-4 md:mt-6 text-lg md:text-xl text-center text-pretty">
          We’re growing fast and continuously looking for talented and
          passionate people to join our team. Please have a look at our open
          positions.
        </p>

        <div className="mt-8 md:mt-12 grid sm:grid-cols-2 gap-2 md:w-full">
          {jobsData.map(({ team, position, link }) => (
            <a
              key={position}
              href={link}
              target="_blank"
              rel="noreferrer noopener"
              className="flex flex-col items-start p-5 rounded-2xl text-left outline outline-gray-200 bg-white hover:outline-2 hover:outline-gray-300 focus-visible:outline-2 focus-visible:outline-gray-900"
            >
              <span className="text-brand font-medium text-base">
                {team ? team : "Open Application"}
              </span>
              <span className="mt-4 text-gray-900 font-semibold text-lg">
                {position}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
