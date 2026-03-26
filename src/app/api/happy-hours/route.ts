import { NextResponse } from "next/server";
import data from "../../../../data/happy-hours.json";

export async function GET() {
  return NextResponse.json(data);
}
