import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { env } from "@/data/env/server";
import {
  insertUser,
  updateUser,
  deleteUser,
} from "@/app/features/users/db/users";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  console.log("Webhook body:", body);

  // Handle the webhook
  switch (eventType) {
    case "user.created":
    case "user.updated": {
      const email = event.data.email_addresses?.find(
        (email) => email.id === event.data.primary_email_address_id
      )?.email_address;
      const name = `${event.data.first_name} ${event.data.last_name}`.trim();
      if (email == null) return new Response("No email", { status: 400 });
      if (name === "") return new Response("No name", { status: 400 });

      if (event.type === "user.created") {
        const user = await insertUser({
          clerkUserId: event.data.id,
          email,
          name,
          imageUrl: event.data.image_url,
          role: "user",
        });

        await syncClerkUserMetadata(user);
      } else {
        await updateUser({
          clerkUserId: event.data.id,
          email,
          name,
          imageUrl: event.data.image_url,
          role: event.data.public_metadata.role,
        });
      }
      break;
    }
    case "user.deleted": {
      if (event.data.id != null) {
        await deleteUser(event.data.id);
      }
      break;
    }
  }
  return new Response("", { status: 200 });
}
