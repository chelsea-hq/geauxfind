import { NextResponse } from "next/server";
import data from "../../../../data/date-night.json";

export async function GET() {
  return NextResponse.json(data);
}
