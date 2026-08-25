import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, stored: string) {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored);
  }
  return stored === password;
}

export function isHashedPassword(stored: string) {
  return stored.startsWith("$2");
}
