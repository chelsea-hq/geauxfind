import { NextResponse } from "next/server";
import data from "../../../../data/festivals.json";

export async function GET() {
  return NextResponse.json(data);
}
