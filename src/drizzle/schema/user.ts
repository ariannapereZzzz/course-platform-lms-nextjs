import { integer, pgEnum, pgTable, text, timestamp} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { relations } from "drizzle-orm";
import { CourseProductTable } from "./courseProduct";
import { UserCourseAccessTable } from "./userCourseAccess";

export const userRoles = ["user", "admin"] as const
export type userRole = (typeof userRoles)[number]
export const userRoleEnum = pgEnum("user_role", userRoles)

export const UserTable = pgTable("users", {
  id,
  clerkUserId: text().notNull().unique(),
  email: text().notNull(),
  name: text().notNull(),
  role: userRoleEnum().notNull().default("user"),
  imageUrl: text(),
  priceInDollars: integer().notNull(),
  deletedAt: timestamp({ withTimezone: true}),
  createdAt,
  updatedAt,
})

export const UserRelationships = relations(UserTable, ({one,many}) => ({
  courseProducts: many(CourseProductTable),
  userCourseAccess: one(UserCourseAccessTable)
}))