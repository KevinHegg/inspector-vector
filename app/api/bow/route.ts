import { NextResponse } from "next/server";import { DEV_BOT } from "@/lib/bot";export async function GET(){return NextResponse.json(DEV_BOT);}
