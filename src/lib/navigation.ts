export type ScreenType = "login" | "profile" | "travel" | "swipe" | "chat" | "account" | "matches" | "access" | "admin" | "trips";

export const pathToScreen: Record<string, ScreenType> = {
  "/": "login",
  "/login": "login",
  "/profile": "profile",
  "/travel": "travel",
  "/swipe": "swipe",
  "/matches": "matches",
  "/chat": "chat",
  "/account": "account",
  "/admin": "admin",
  "/access": "access",
  "/trips": "trips",
};

export const screenToPath: Record<ScreenType, string> = {
  login: "/login",
  profile: "/profile",
  travel: "/travel",
  swipe: "/swipe",
  matches: "/matches",
  chat: "/chat",
  account: "/account",
  admin: "/admin",
  access: "/access",
  trips: "/trips",
};
