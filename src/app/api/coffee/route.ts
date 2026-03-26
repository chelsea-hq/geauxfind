import { NextResponse } from "next/server";
import data from "../../../../data/coffee-shops.json";

export async function GET() {
  return NextResponse.json(data);
}
