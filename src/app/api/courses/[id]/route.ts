import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { CourseTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/services/clerk";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const course = await db
      .select()
      .from(CourseTable)
      .where(eq(CourseTable.id, params.id))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course[0]);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, redirectToSignIn } = await getCurrentUser();

    if (!userId) {
      return redirectToSignIn();
    }

    const body = await request.json();
    const { name, description } = body;

    const [updatedCourse] = await db
      .update(CourseTable)
      .set({
        name,
        description,
      })
      .where(eq(CourseTable.id, params.id))
      .returning();

    if (!updatedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, redirectToSignIn } = await getCurrentUser();

    if (!userId) {
      return redirectToSignIn();
    }

    const [deletedCourse] = await db
      .delete(CourseTable)
      .where(eq(CourseTable.id, params.id))
      .returning();

    if (!deletedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
