import { NextResponse } from "next/server";
import data from "../../../../data/breweries.json";

export async function GET() {
  return NextResponse.json(data);
}
