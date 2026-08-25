import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/util";
import { LibraryTable } from "./LibraryTable";

export default async function LibraryPage() {
  const items = await prisma.yjVerificationLibrary.findMany({
    orderBy: { id: "desc" },
    include: {
      creator: {
        select: { firstname: true, lastname: true },
      },
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-xl">校验库</h1>
      <div className="mt-4">
        <LibraryTable
          items={items.map((item) => ({
            id: item.id,
            type: item.type,
            source: item.source,
            thumbnail: item.thumbnail,
            context: item.context,
            creator: `${item.creator.firstname} ${item.creator.lastname}`,
            createdAt: formatDateTime(item.createdAt),
          }))}
        />
      </div>
    </div>
  );
}
