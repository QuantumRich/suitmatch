import { lightingQualityLabel } from "@/lib/color/lighting";

export default function LightingBadge({ quality }: { quality: number }) {
  const label = lightingQualityLabel(quality);
  const icon = quality >= 0.65 ? "🟢" : quality >= 0.40 ? "🟡" : "🔴";
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-200">
      {icon} Lighting: {label}
    </span>
  );
}
