// Grey shimmering placeholder in the shape of a chart card (title, big number, chart), shown while data loads.
import { card } from "@/components/ui/styles";

export default function ChartSkeleton({ chartHeight = "h-56" }: { chartHeight?: string }) {
  return (
    <div aria-hidden className={`${card} flex flex-col gap-5`}>
      <div className="flex flex-col gap-2">
        <div className="skeleton h-5 w-36" />
        <div className="skeleton h-8 w-24" />
      </div>
      <div className={`skeleton w-full ${chartHeight}`} />
    </div>
  );
}
