// Part 2: upload a pre-recorded clip
// TODO: remove upload before the final product (live recording only). Kept so Parts 1 and 3 can test with clips.
"use client";

import { useState } from "react";

export default function VideoUpload({ onSelect }: { onSelect: (url: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-3">
      {/* The real input is visually hidden; the label is the button, so it stays keyboard- and screen-reader-usable. */}
      <label className="cursor-pointer rounded bg-black px-4 py-2 text-white focus-within:ring-2 focus-within:ring-offset-2">
        {name ? "Choose a different video" : "Choose video"}
        <input
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setName(file.name);
            onSelect(URL.createObjectURL(file));
          }}
        />
      </label>
      <span className="text-sm text-gray-600">{name || "Side view of you running on a treadmill"}</span>
    </div>
  );
}
