import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { CourseTable } from "@/drizzle/schema";
import { getCurrentUser } from "@/services/clerk";

export async function GET() {
  try {
    const courses = await db.select().from(CourseTable);
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, redirectToSignIn } = await getCurrentUser();

    if (!userId) {
      return redirectToSignIn();
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    const [newCourse] = await db
      .insert(CourseTable)
      .values({
        name,
        description,
      })
      .returning();

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
