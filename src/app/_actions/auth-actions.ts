"use server";
import { headers } from "next/headers";
import { SignInModel } from "../(auth)/_types/auth.types";

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
      return {
        isSuccess: true,
        response: await response.json(),
      };
    }
  } catch {
    return {
      isSuccess: false,
    };
  }
}
