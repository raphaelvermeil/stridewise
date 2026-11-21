// Part 2: upload a pre-recorded clip (main demo path)
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
