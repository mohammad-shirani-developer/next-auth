import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { UserSession } from "../_types/auth.types";

const JWT_SECRET = "CfnpLAm+hPkHzWsEGEpWvEpe6VNcmk2XS315z4ocokk=";

const encodedKey = new TextEncoder().encode(JWT_SECRET);

export async function encryptSession(session: UserSession): Promise<string> {
  return new SignJWT(session as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(encodedKey);
}

export async function decryptSession(session: string) {
  const { payload } = await jwtVerify(session, encodedKey, {
    algorithms: ["HS256"],
  });
  return payload;
}
