import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, name, parcel } = body;

    await resend.emails.send({
      from: "Baupotential <onboarding@resend.dev>",
      to: email,
      subject: "Ihre Anfrage wurde erhalten",
      html: `
        <h2>Vielen Dank ${name}</h2>
        <p>Wir haben Ihre Anfrage erhalten.</p>
        <p>Parzelle: ${parcel}</p>
      `,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false }, { status: 500 });
  }
}