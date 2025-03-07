"use client"

import React from "react"

export default function PrivacyPolicy() {
  return (
    <div className="flex justify-center items-center w-full">
      <iframe
        title="Privacy Policy"
        src="/static/documents/privacy-policy.html"
        height="700px"
        className="h-screen md:h-full w-full max-w-[800px]"
      />
    </div>
  )
}
