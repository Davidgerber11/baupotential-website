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

      // TWINT + card
      payment_method_types: ["card", "twint"],

      customer_email: email,

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "chf",

            product_data: {
              name: "Baupotenzialanalyse",
              description: `Parzelle ${parcel_number}, ${municipality}`,
            },

            // CHF 99.00
            unit_amount: 9900,
          },
        },
      ],

      metadata: {
        order_id: String(order_id),
        parcel_number: String(parcel_number),
        municipality: String(municipality),
      },

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order`,
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