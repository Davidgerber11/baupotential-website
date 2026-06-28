// app/api/checkout/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      order_id,
      email,
      parcel_number,
      municipality,
    } = body;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      // TEMP: TWINT pending Stripe approval — re-add "twint" once enabled in Dashboard
      payment_method_types: ["card"],

      customer_email: email,

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "chf",

            product_data: {
              name: "Baupotentialanalyse",
              description: `Parzelle ${parcel_number}, ${municipality}`,
            },

            // TEMP for live-mode smoke test — revert to 4900 (CHF 49.00) before going live
            unit_amount: 100,
          },
        },
      ],

      metadata: {
        order_id: String(order_id),
        parcel_number: String(parcel_number),
        municipality: String(municipality),
      },

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?order=${order_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
      },
      {
        status: 500,
      }
    );
  }
}