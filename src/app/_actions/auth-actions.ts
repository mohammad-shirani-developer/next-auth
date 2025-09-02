"use server";
import { jwtDecode } from "jwt-decode";
import { cookies, headers } from "next/headers";
import { SignInModel } from "../(auth)/_types/auth.types";
import { JWT, UserResponse, UserSession } from "../_types/auth.types";
import { decryptSession, encryptSession } from "../utils/session";

export async function signinAction(model: SignInModel) {
  const headerList = headers();
  const userAgent = (await headerList).get("user-agent");
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/identity/signin`,
      {
        method: "POST",
        body: JSON.stringify({ ...model, userAgent }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.ok) {
      const user = await response.json();
      await setAuthCookieAction(user);
      return {
        isSuccess: true,
        response: user,
      };
    }
  } catch {
    return {
      isSuccess: false,
    };
  }
}

export async function setAuthCookieAction(user: UserResponse) {
  const decoded = jwtDecode<JWT>(user.accessToken);

  const session: UserSession = {
    username: decoded.username,
    fullName: decoded.fullName,
    pic: decoded.pic,
    exp: decoded.exp * 1000,
    accessToken: user.accessToken,
    sessionId: user.sessionId,
    sessionExpiry: user.sessionExpiry * 1000,
  };

  const cookieStore = await cookies();
  const encryptedSession = await encryptSession(session);
  const decryptedSession = await decryptSession(encryptedSession);
  console.log(decryptedSession);

  cookieStore.set("moh-session", JSON.stringify(encryptedSession), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
}
