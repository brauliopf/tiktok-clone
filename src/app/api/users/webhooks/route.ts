import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser } from "@/db/mutations";

export async function POST(req: Request) {
  console.log("USER CREATED WEBHOOK");
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  // Do something with payload
  /* Example Webhook payload: https://clerk.com/docs/webhooks/overview#payload-structure
   * body === evt.data stringfied
   */
  // @ts-ignore
  const { id, first_name, last_name, profile_image_url, image_url } = evt.data;
  // @ts-ignore
  const temp = evt.data.email_addresses;
  const { email_address } = temp && temp[0];
  const eventType = evt.type;

  let user;
  if (eventType == "user.created") {
    user = await createUser({
      clerk_id: id!,
      email: email_address,
      firstName: first_name,
      lastName: last_name,
      profileImageURL: profile_image_url || image_url,
    });
  }

  user && console.log("USER CREATED:", user.data);

  return new Response("Webhook received", { status: 200 });
}
