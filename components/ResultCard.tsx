import { deltaEToScore, scoreToCategory, categoryLabel } from "@/lib/color/score";
import { deltaE } from "@/lib/color/distance";
import { tupleToLab } from "@/lib/color/space";
import { lightingQualityLabel } from "@/lib/color/lighting";
import type { Measurement } from "@/lib/realtime/types";

type Props = {
  measurement: Measurement;
  reference: Measurement | null;
  referenceName: string | null;
};

export default function ResultCard({ measurement, reference, referenceName }: Props) {
  const swatch = measurement.swatchHex;
  const confidencePct = Math.round(measurement.confidence * 100);
  const lightingLabel = lightingQualityLabel(measurement.lightingQuality);

  let matchScore: number | null = null;
  let category = null;
  let catLabel = "";

  if (reference) {
    const de = deltaE(tupleToLab(measurement.lab), tupleToLab(reference.lab));
    matchScore = deltaEToScore(de);
    category = scoreToCategory(matchScore);
    catLabel = categoryLabel(category);
  }

  const categoryStyles = {
    excellent: { text: "text-emerald-300", bg: "bg-emerald-900/30 border-emerald-700" },
    good: { text: "text-teal-300", bg: "bg-teal-900/30 border-teal-700" },
    borderline: { text: "text-amber-300", bg: "bg-amber-900/30 border-amber-700" },
    poor: { text: "text-rose-300", bg: "bg-rose-900/30 border-rose-700" },
  }[category ?? "poor"] ?? { text: "text-slate-400", bg: "" };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
      {/* Swatch bar */}
      <div className="h-24 w-full relative" style={{ background: swatch }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-3 left-4 text-xs font-mono text-white/70">{swatch}</div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {matchScore !== null ? (
          <div className={`rounded-xl border p-4 text-center ${categoryStyles.bg}`}>
            <div className={`text-5xl font-bold tracking-tight ${categoryStyles.text}`}>{matchScore}%</div>
            <div className={`text-sm font-semibold uppercase tracking-widest mt-1 ${categoryStyles.text}`}>
              {catLabel}
            </div>
            {referenceName && (
              <div className="text-slate-400 text-xs mt-1">vs {referenceName}</div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center text-slate-400 text-sm">
            Waiting for a reference outfit.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Confidence" value={`${confidencePct}%`} warn={measurement.confidence < 0.5} />
          <Stat label="Lighting" value={lightingLabel} warn={measurement.lightingQuality < 0.4} />
          <Stat label="Visibility" value={`${Math.round(measurement.jacketVisibility * 100)}%`} warn={measurement.jacketVisibility < 0.4} />
          <Stat label="Consistency" value={`${Math.round(measurement.colorConsistency * 100)}%`} warn={measurement.colorConsistency < 0.4} />
        </div>

        {measurement.confidence < 0.3 && (
          <div className="bg-rose-900/30 border border-rose-700 rounded-xl p-3 text-rose-300 text-sm">
            Low confidence — try another photo in brighter, neutral light.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn: boolean }) {
  return (
    <div className={`bg-slate-800/60 rounded-xl p-3 border ${warn ? "border-amber-700/60" : "border-transparent"}`}>
      <div className="text-slate-500 text-xs uppercase tracking-wide">{label}</div>
      <div className={`font-semibold mt-0.5 ${warn ? "text-amber-300" : "text-slate-200"}`}>{value}</div>
    </div>
  );
}
