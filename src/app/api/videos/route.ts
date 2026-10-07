import { readdir } from "node:fs/promises";
import path from "node:path";
import { getRequestUser } from "@/lib/requestAuth";
import { writeError, writeResponse } from "@/lib/util";

function publicVideoUrl(relativePath: string) {
  const prefix = (process.env.VideoPrefix ?? "http://localhost:3000/video").replace(/\/$/, "");
  const encoded = relativePath
    .split(/[/\\]/)
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${prefix}/${encoded}`;
}

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".ts",
  ".webm",
  ".m4v",
  ".mpeg",
  ".mpg",
]);

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return writeError("未登录", 401);
  }

  const videoDir = path.resolve(process.cwd(), process.env.VideoDir ?? "public/video");
  let entries;
  try {
    entries = await readdir(videoDir, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return writeResponse({ videos: [] });
    }
    throw error;
  }

  const videos = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .flatMap((entry) => {
      const filePath = path.resolve(videoDir, entry.name);
      if (!filePath.startsWith(`${videoDir}${path.sep}`)) {
        return [];
      }
      const relativePath = path.relative(videoDir, filePath);
      return [{ name: entry.name, path: relativePath, url: publicVideoUrl(relativePath) }];
    })
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));

  return writeResponse({ videos });
}
