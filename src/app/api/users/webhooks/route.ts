import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, updateUser } from "@/db/mutations/users";
import { getUser } from "@/db/queries/users";
import { getTextEmbedding } from "@/lib/gemini";
import { updateRecommendations } from "@/app/actions";

export async function POST(req: Request) {
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

  async function getUserEmbedding(clerk_id: string) {
    // get user object
    const user = await getUser(clerk_id);
    // build text summary
    let profile = "" + user.age && `User is ${user.age}.`;
    profile = profile + user.country && `\nUser comes from ${user.country}`;
    profile =
      profile + user.topicsOfInterest &&
      `\nUser is interested in ${user.topicsOfInterest?.join(", ")}`;

    // get embeddings from an llm
    console.log("GET USER EMBEDDINGS", profile);
    const embeddings = getTextEmbedding(profile);

    return embeddings;
  }

  // Do something with payload
  /* Example Webhook payload: https://clerk.com/docs/webhooks/overview#payload-structure
   * body === evt.data stringfied
   */
  const eventType = evt.type;
  if (eventType == "user.created") {
    const { id, first_name, last_name, image_url } = evt.data;
    const primary_email_id = evt.data.primary_email_address_id;
    const email_address = evt.data.email_addresses.find(
      (value) => value.id == primary_email_id
    )?.email_address;

    // CREATE
    const user = await createUser({
      clerk_id: id!,
      email: email_address!,
      firstName: first_name || "",
      lastName: last_name,
      profileImageURL: image_url,
    });
    if (user) {
      console.log("USER CREATED", user.data);
    }
    // UPDATE
  } else if (eventType == "user.updated") {
    const { id: clerk_id, first_name, last_name, image_url } = evt.data;
    const primary_email_id = evt.data.primary_email_address_id;
    const email_address = evt.data.email_addresses.find(
      (value) => value.id == primary_email_id
    )?.email_address;

    // --metadata
    const onboarded = evt.data.public_metadata.onboarded;
    const videoDuration = evt.data.public_metadata.videoDuration;
    const topicsOfInterest = evt.data.public_metadata.topicsOfInterest;

    const embeddings = await getUserEmbedding(clerk_id);

    const user = await updateUser({
      clerk_id: clerk_id!,
      email: email_address!,
      firstName: first_name || "",
      lastName: last_name,
      profileImageURL: image_url,
      // @ts-expect-error --ignore metadata types
      onboarded: onboarded,
      // @ts-expect-error --ignore metadata types
      videoDuration: videoDuration,
      // @ts-expect-error --ignore metadata types
      topicsOfInterest: topicsOfInterest,
      embeddings: embeddings,
    });

    if (user) {
      console.log("USER UPDATED", user.data);
    }

    updateRecommendations();
  }

  return new Response("Webhook received", { status: 200 });
}
