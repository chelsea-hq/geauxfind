import { NextResponse } from "next/server";
import data from "../../../../data/photo-spots.json";

export async function GET() {
  return NextResponse.json(data);
}
