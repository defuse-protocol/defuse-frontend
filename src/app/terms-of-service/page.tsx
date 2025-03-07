"use client"

import React from "react"

export default function TermsAndConditions() {
  return (
    <div className="flex justify-center items-center w-full">
      <iframe
        title="Terms and Conditions"
        src="/static/documents/terms-of-service.html"
        height="700px"
        className="h-screen md:h-full w-full max-w-[800px]"
      />
    </div>
  )
}
