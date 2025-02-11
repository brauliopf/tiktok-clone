import { getVideos } from "@/db/query";
import { generateVideoMetadata } from "../actions";
import { VideoIDKey } from "@/types/video";

export default async function Sandbox() {
  console.error("FROM SANDBOX");
  const videos = await getVideos({ limit: 10, offset: 0 });

  const testAction = async (formData: FormData) => {
    "use server";
    const videoString = formData.get("video"); // id, s3Key, title, status

    if (typeof videoString !== "string") {
      throw new Error("No video JSON data found in FormData");
    }

    const video: VideoIDKey = JSON.parse(videoString);
    const id = video.id;
    const s3Key = video.s3Key;

    await generateVideoMetadata({ id, s3Key });
  };

  return (
    <div>
      <h1>Sandbox</h1>
      <div className="align-center p-10 w-1/2">
        <h2>Video Processing</h2>
        <form
          className=" flex flex-col gap-4 border-gray-300"
          action={testAction}
        >
          <select
            name="video"
            className="p-2.5 border border-gray-300 rounded-md w-full"
          >
            {videos.data.map((video) => (
              <option
                value={JSON.stringify(video)}
                key={video.title}
                style={{ padding: "10px" }}
              >
                {video.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-5 py-2 rounded-md bg-blue-500 text-white cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
