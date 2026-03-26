import { NextResponse } from "next/server";
import data from "../../../../data/outdoor.json";

export async function GET() {
  return NextResponse.json(data);
}
