import { NextResponse } from "next/server"

import { supabase } from "@src/libs/supabase"
import { logger } from "@src/utils/logger"

export async function GET() {
  try {
    const { data, error } = await supabase.from("solver_liquidity").select("*")

    if (error) {
      logger.error(error)
      return NextResponse.json(
        { error: "Failed to fetch solver liquidity" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Solver liquidity not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
