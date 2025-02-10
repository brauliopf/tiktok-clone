import Feed from "@/components/feed";
import { getVideos } from "@/db/query";
import { downloadMultipleFiles } from "@/lib/s3";

export default async function feedPage() {
  const { data: localVideos } = await getVideos({
    limit: 3,
    offset: 0,
  });
  const s3Videos = await downloadMultipleFiles(localVideos.map((v) => v.s3Key));

  return (
    <div className="flex flex-1 fixed left-0 right-0 top-0 bottom-0 h-screen overflow-y-auto">
      <Feed initialVideos={s3Videos.map((v) => v.url)} />
    </div>
  );
}
