import { NextResponse } from "next/server";
import data from "../../../../data/farmers-markets.json";

export async function GET() {
  return NextResponse.json(data);
}
