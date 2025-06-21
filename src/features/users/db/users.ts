import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { UserTable } from "@/drizzle/schema";
import { revalidateUserCache } from "./cache";

export async function insertUser(data: typeof UserTable.$inferInsert) {
  console.log("🗄️ Inserting user:", {
    email: data.email,
    clerkUserId: data.clerkUserId,
  });

  const [newUser] = await db
    .insert(UserTable)
    .values(data)
    .returning()
    .onConflictDoUpdate({
      target: [UserTable.clerkUserId],
      set: data,
    });
  if (newUser == null) {
    console.error("❌ Failed to create user");
    throw new Error("Failed to create user");
  }
  console.log("✅ User inserted successfully:", newUser.id);
  revalidateUserCache(newUser.id);
  return newUser;
}

export async function updateUser(
  { clerkUserId }: { clerkUserId: string },
  data: Partial<typeof UserTable.$inferInsert>
) {
  console.log("🔄 Updating user:", { clerkUserId, data });

  const [updatedUser] = await db
    .update(UserTable)
    .set(data)
    .where(eq(UserTable.clerkUserId, clerkUserId))
    .returning();

  if (updatedUser == null) {
    console.error("❌ Failed to update user");
    throw new Error("Failed to update user");
  }
  console.log("✅ User updated successfully:", updatedUser.id);
  revalidateUserCache(updatedUser.id);
  return updatedUser;
}

export async function deleteUser({ clerkUserId }: { clerkUserId: string }) {
  console.log("🗑️ Soft deleting user:", clerkUserId);

  const [deletedUser] = await db
    .update(UserTable)
    .set({
      deletedAt: new Date(),
      email: "redacted@deleted.com",
      name: "Deleted User",
      clerkUserId: "deleted-user",
      imageUrl: null,
    })
    .where(eq(UserTable.clerkUserId, clerkUserId))
    .returning();

  if (deletedUser == null) {
    console.error("❌ Failed to delete user");
    throw new Error("Failed to delete user");
  }
  console.log("✅ User soft deleted successfully:", deletedUser.id);
  revalidateUserCache(deletedUser.id);
  return deletedUser;
}
