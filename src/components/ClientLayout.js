"use client";
import MusicPlayer from "@/components/MusicPlayer";

export default function ClientLayout(props) {
  return (
    <>
      {props.children}
      <MusicPlayer />
    </>
  );
}