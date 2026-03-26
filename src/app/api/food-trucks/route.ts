import { NextResponse } from "next/server";
import data from "../../../../data/food-trucks.json";

export async function GET() {
  return NextResponse.json(data);
}
