import { NextResponse } from "next/server";
import { getOrdersByEmail } from "@/lib/square";

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  try {
    const orders = await getOrdersByEmail(email);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Order lookup failed", err);
    return NextResponse.json(
      { error: "Could not look up orders" },
      { status: 502 },
    );
  }
}
