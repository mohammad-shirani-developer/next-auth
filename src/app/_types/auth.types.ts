export interface UserResponse {
  accessToken: string;
  sessionId: string;
  sessionExpiry: number;
}

export interface JWT {
  username: string;
  fullName: string;
  pic: string;
  exp: number;
}

export interface UserSession extends JWT, UserResponse {}
