import {authMiddleware} from "@clerk/nextjs";

//https://clerk.com/docs/nextjs/get-started-with-nextjs#protect-your-application
//Now that Clerk is installed and mounted in your application, it’s time to decide which pages are public and which need to hide behind authentication. We do this by creating a middleware.ts file at the root folder (or inside src/ if that is how you set up your app).

export default authMiddleware(
    {
        publicRoutes: ['/']
    }
);

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};


// https://clerk.com/docs/nextjs/middleware#auth-middleware
// 文件名字必须叫 middleware



//This is our previous version of middleware and will soon be deprecated.
/*//https://clerk.com/docs/nextjs/middleware#previous-versions
import { withClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default withClerkMiddleware((req) => {
  return NextResponse.next();
});

// Stop Middleware running on static files
export const config = { matcher:  '/((?!_next/image|_next/static|favicon.ico).*)',};*/
