import { NextResponse } from "next/server";
import data from "../../../../data/daily-specials.json";

export async function GET() {
  return NextResponse.json(data);
}
