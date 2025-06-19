import { UserRole } from "@/drizzle/schema";

export {};

declare global {
  interface CustomJwtSessionClaims {
    dbId?: string;
    role?: UserRole;
  }

  interface userPublicMetadata {
    dbId?: string;
    role?: UserRole;
  }
}
