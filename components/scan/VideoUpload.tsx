// Part 2: upload a pre-recorded clip
// TODO: remove upload before the final product (live recording only). Kept so Parts 1 and 3 can test with clips.
"use client";

export default function VideoUpload({ onSelect }: { onSelect: (url: string) => void }) {
  return (
    <input
      type="file"
      accept="video/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onSelect(URL.createObjectURL(file));
      }}
    />
  );
}
