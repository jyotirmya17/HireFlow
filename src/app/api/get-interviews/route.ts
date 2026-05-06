import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "interviews.json");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }

    const data = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(data || "[]");

    return NextResponse.json(json);
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
