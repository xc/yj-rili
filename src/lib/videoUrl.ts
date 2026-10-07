export function publicVideoUrl(relativePath: string) {
  const prefix = (process.env.VideoPrefix ?? "http://localhost:3000/video").replace(/\/$/, "");
  const encoded = relativePath
    .split(/[/\\]/)
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${prefix}/${encoded}`;
}

export function firstVideoPath(videos: unknown) {
  if (!Array.isArray(videos)) {
    return null;
  }
  for (const item of videos) {
    if (!item || typeof item !== "object" || !("path" in item)) {
      continue;
    }
    const path = item.path;
    if (typeof path === "string" && path.trim()) {
      return path.trim();
    }
  }
  return null;
}
