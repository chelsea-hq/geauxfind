import { NextResponse } from "next/server";
import data from "../../../../data/late-night.json";

export async function GET() {
  return NextResponse.json(data);
}
