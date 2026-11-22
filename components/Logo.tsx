import Link from "next/link";

// Skeleton runner, like the pose overlay: bones in dark purple, the "scanned" joints in a contrasting coral.
const BONES = ["47,58 62,66 59,82", "47,58 40,71 27,76", "52,32 41,42 35,53", "52,32 61,45 71,39", "52,32 47,58"];
const JOINTS = [[52, 32], [41, 42], [35, 53], [61, 45], [71, 39], [47, 58], [62, 66], [59, 82], [40, 71], [27, 76]];

// large: the bigger version for the login page.
export default function Logo({ href, large = false }: { href: string; large?: boolean }) {
  return (
    <Link href={href} className={`flex items-center ${large ? "gap-3 text-h1" : "gap-2 text-h4"}`}>
      {/* viewBox cropped to the figure, so it sits right up against the name */}
      <svg aria-hidden viewBox="22 8 55 80" className={`${large ? "h-14" : "h-9"} w-auto`}>
        <g fill="none" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" className="stroke-brand">
          {BONES.map((p) => <polyline key={p} points={p} />)}
        </g>
        <circle cx="57" cy="19" r="8" className="fill-brand" />
        {JOINTS.map(([x, y]) => <circle key={`${x},${y}`} cx={x} cy={y} r={3.4} className="fill-joint" />)}
      </svg>
      <span translate="no">StrideWise</span>
    </Link>
  );
}
