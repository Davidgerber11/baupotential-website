import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID fehlt." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Order status fetch error:", error);
    return NextResponse.json({ error: "Fehler beim Lesen der Bestellung." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Bestellung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}
