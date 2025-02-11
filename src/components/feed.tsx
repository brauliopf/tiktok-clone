"use client";

import React from "react";
import { useState, useEffect } from "react";
import VideoCard from "./videoCard";
import { getFilesFromS3 } from "@/lib/s3";
import { getVideosS3Key } from "@/db/query";
import { useInView } from "react-intersection-observer";

const NUMBER_OF_VIDEOS_TO_FETCH = 3;

interface feedProps {
  initialVideos: string[];
}

const Feed: React.FC<feedProps> = ({ initialVideos }) => {
  const [offset, setOffset] = useState(initialVideos.length);
  const [videos, setVideos] = useState<string[]>(initialVideos);
  const { ref, inView } = useInView();

  const loadMoreVideos = async () => {
    const localVideos = await getVideosS3Key({
      offset,
      limit: NUMBER_OF_VIDEOS_TO_FETCH,
    });
    const s3Videos = await getFilesFromS3(localVideos.data.map((v) => v.s3Key));
    setVideos((videos) => [...videos, ...s3Videos.map((v) => v.url)]);
    setOffset((offset) => offset + NUMBER_OF_VIDEOS_TO_FETCH);
  };

  useEffect(() => {
    if (inView) {
      loadMoreVideos();
    }
  }, [inView, loadMoreVideos]);

  return (
    <div className="flex flex-col gap-4 flex-1 my-4 items-center">
      {Array.isArray(videos) &&
        videos.map((video, index) => <VideoCard video={video} key={index} />)}
      <div ref={ref}>Loading...</div>
    </div>
  );
};

export default Feed;
