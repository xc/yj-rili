import { writeResponse } from "@/lib/util";

export async function POST() {
  return writeResponse({ ok: true });
}
