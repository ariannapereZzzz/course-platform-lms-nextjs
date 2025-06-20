import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/services/clerk";
import { canAccessAdminPages } from "@/app/permissions/general";

export default function ConsumerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}

function Navbar() {
  return (
    <header className="flex h-12 shadow bg-background z-10">
      <nav className="flex gap-4 container">
        <Link
          className="mr-auto text-lg hover:underline px-2 flex items-center"
          href="/"
        >
          Web Dev Simplified
        </Link>
        <Suspense fallback={<div>Loading...</div>}>
          <SignedIn>
            <AdminLink />
            <Link
              className="hover:bg-accent/10 flex items-center px-2"
              href="/courses"
            >
              My Courses
            </Link>
            <Link
              className="hover:bg-accent/10 flex items-center px-2"
              href="/purchases"
            >
              Purchase History
            </Link>
            <div className="size-8 self-center">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: { width: "100%", height: "100%" },
                  },
                }}
              />
            </div>
          </SignedIn>
        </Suspense>
        <Suspense fallback={<div>Loading...</div>}>
          <SignedOut>
            <Button className="self-center" asChild>
              <SignInButton>Sign In</SignInButton>
            </Button>
          </SignedOut>
        </Suspense>
      </nav>
    </header>
  );
}

async function AdminLink() {
  const user = await getCurrentUser();
  if (!canAccessAdminPages(user)) return null;
  return (
    <Link className="hover:bg-accent/10 flex items-center px-2" href="/">
      Admin
    </Link>
  );
}
