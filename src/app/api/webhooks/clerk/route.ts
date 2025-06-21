import { env } from "@/data/env/server";
import { UserRole } from "@/drizzle/schema";
import { deleteUser, insertUser, updateUser } from "@/features/users/db/users";
import { syncClerkUserMetadata } from "@/services/clerk";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  console.log("🔔 Webhook received");

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  console.log("📋 Webhook headers:", {
    svixId,
    svixTimestamp,
    svixSignature: svixSignature ? "present" : "missing",
  });

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("❌ Missing svix headers");
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  console.log("📦 Webhook payload type:", payload.type);
  console.log(
    "📦 Webhook payload data:",
    JSON.stringify(payload.data, null, 2)
  );

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
    console.log("✅ Webhook signature verified successfully");
  } catch (err) {
    console.error("❌ Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  console.log("🔄 Processing webhook event:", event.type);

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      console.log("👤 Processing user event:", event.type);

      const email = event.data.email_addresses.find(
        (email) => email.id === event.data.primary_email_address_id
      )?.email_address;
      const name = `${event.data.first_name} ${event.data.last_name}`.trim();

      console.log("📧 User email:", email);
      console.log("👤 User name:", name);

      if (email == null) {
        console.error("❌ No email found");
        return new Response("No email", { status: 400 });
      }
      if (name === "") {
        console.error("❌ No name found");
        return new Response("No name", { status: 400 });
      }

      if (event.type === "user.created") {
        console.log("➕ Creating new user");
        const user = await insertUser({
          clerkUserId: event.data.id,
          email,
          name,
          imageUrl: event.data.image_url,
          role: "user",
        });
        console.log("✅ User created:", user.id);

        await syncClerkUserMetadata(user);
        console.log("✅ User metadata synced");
      } else {
        console.log("🔄 Updating existing user");
        await updateUser(
          { clerkUserId: event.data.id },
          {
            email,
            name,
            imageUrl: event.data.image_url,
            role: event.data.public_metadata.role as UserRole,
          }
        );
        console.log("✅ User updated");
      }
      break;
    }
    case "user.deleted": {
      console.log("🗑️ Processing user deletion");
      if (event.data.id != null) {
        await deleteUser({ clerkUserId: event.data.id });
        console.log("✅ User deleted");
      } else {
        console.error("❌ No user ID found for deletion");
      }
      break;
    }
    default: {
      console.log("⚠️ Unhandled webhook event type:", event.type);
    }
  }

  console.log("✅ Webhook processed successfully");
  return new Response("", { status: 200 });
}
