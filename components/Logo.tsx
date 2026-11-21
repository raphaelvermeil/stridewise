import Link from "next/link";

// shortcut: placeholder mark until the real logo exists
export default function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-h4">
      <span aria-hidden className="size-8 rounded-full bg-accent" />
      StrideWise
    </Link>
  );
}
