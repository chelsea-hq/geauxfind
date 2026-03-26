import { NextResponse } from "next/server";
import data from "../../../../data/dance-halls.json";

export async function GET() {
  return NextResponse.json(data);
}
