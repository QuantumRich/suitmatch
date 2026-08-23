import { lightingQualityLabel } from "@/lib/color/lighting";

export default function LightingBadge({ quality }: { quality: number }) {
  const label = lightingQualityLabel(quality);
  const { bg, text, dot } =
    quality >= 0.65
      ? { bg: "bg-emerald-900/40 border-emerald-700", text: "text-emerald-300", dot: "bg-emerald-400" }
      : quality >= 0.4
      ? { bg: "bg-amber-900/40 border-amber-700", text: "text-amber-300", dot: "bg-amber-400" }
      : { bg: "bg-rose-900/40 border-rose-700", text: "text-rose-300", dot: "bg-rose-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
