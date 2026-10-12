import { CheckSystemRequestError, createCheckSystemClient } from "@/lib/checkSystem";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/requestAuth";
import { canAccessTask } from "@/lib/taskAccess";
import { writeError, writeResponse } from "@/lib/util";

function readVideoId(videos: unknown) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return null;
  }
  const item = videos[0];
  if (!item || typeof item !== "object" || !("id" in item)) {
    return null;
  }
  const id = Number(item.id);
  return Number.isInteger(id) ? id : null;
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return writeError("未登录", 401);
  }

  let body: { id?: number };
  try {
    body = (await request.json()) as { id?: number };
  } catch {
    return writeError("请求无效");
  }

  const id = Number(body.id);
  if (!id) {
    return writeError("请选择任务");
  }

  const existing = await prisma.yjTask.findUnique({
    where: { id },
    select: { id: true, creator: true, branchId: true, videos: true },
  });
  if (!existing) {
    return writeError("任务不存在", 404);
  }
  if (!canAccessTask(user, existing)) {
    return writeError("无权限", 403);
  }

  const videoId = readVideoId(existing.videos);
  if (videoId !== null) {
    try {
      await createCheckSystemClient().deleteTask(existing.id, videoId);
    } catch (error) {
      if (
        !(error instanceof CheckSystemRequestError && error.message === "任务不存在")
      ) {
        const message =
          error instanceof CheckSystemRequestError ? error.message : "无法连接检测服务";
        return writeError(
          message,
          error instanceof CheckSystemRequestError && error.status === 0 ? 502 : 400,
        );
      }
    }
  }

  await prisma.yjTask.delete({ where: { id } });
  return writeResponse({ ok: true });
}
