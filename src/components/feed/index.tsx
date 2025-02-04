"use client";

import { useState, useEffect } from "react";
import VideoCard from "./video-card";
import { downloadMultipleFiles } from "@/lib/s3";

export default function Feed() {
  const [VObjs, setVObjs] = useState<{ fileKey: string; url: string }[]>([]);

  useEffect(() => {
    const loadVObjs = async () => {
      const fileKeys: string[] = [
        "videos/a648e50e-43b7-4061-a115-9d7d6a82d4fe.mp4",
        "videos/a648e50e-43b7-4061-a115-9d7d6a82d4fe.mp4",
      ];
      const loader = await downloadMultipleFiles(fileKeys);
      setVObjs(loader);
    };

    loadVObjs();
  }, []);

  return (
    <div className="flex flex-col gap-10 items-center mb-10 max-h-screen">
      {VObjs.map((video, index) => {
        return <VideoCard video={video.url} key={index} />;
      })}
    </div>
  );
}
