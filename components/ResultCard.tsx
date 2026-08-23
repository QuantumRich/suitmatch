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

  const categoryColor = {
    excellent: "text-emerald-400",
    good: "text-green-400",
    borderline: "text-yellow-400",
    poor: "text-red-400",
  }[category ?? "poor"] ?? "text-zinc-400";

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl border-2 border-zinc-700 shrink-0"
          style={{ background: swatch }}
        />
        <div>
          <div className="text-xs text-zinc-400 uppercase tracking-widest mb-0.5">Your Suit Color</div>
          <div className="text-sm font-mono text-zinc-300">{swatch}</div>
        </div>
      </div>

      {matchScore !== null ? (
        <div className="text-center">
          <div className={`text-5xl font-bold ${categoryColor}`}>{matchScore}%</div>
          <div className={`text-sm font-semibold uppercase tracking-widest mt-1 ${categoryColor}`}>
            {catLabel}
          </div>
          {referenceName && (
            <div className="text-zinc-400 text-xs mt-1">vs {referenceName}</div>
          )}
        </div>
      ) : (
        <div className="text-center text-zinc-500 text-sm py-2">
          Waiting for a reference outfit.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Confidence" value={`${confidencePct}%`} warn={measurement.confidence < 0.5} />
        <Stat label="Lighting" value={lightingLabel} warn={measurement.lightingQuality < 0.4} />
        <Stat label="Visibility" value={`${Math.round(measurement.jacketVisibility * 100)}%`} warn={measurement.jacketVisibility < 0.4} />
        <Stat label="Consistency" value={`${Math.round(measurement.colorConsistency * 100)}%`} warn={measurement.colorConsistency < 0.4} />
      </div>

      {measurement.confidence < 0.3 && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
          Low confidence — lighting conditions are poor. Try another photo in brighter, neutral light.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn: boolean }) {
  return (
    <div className={`bg-zinc-800 rounded-xl p-3 ${warn ? "border border-yellow-700" : ""}`}>
      <div className="text-zinc-500 text-xs uppercase tracking-wide">{label}</div>
      <div className={`font-semibold mt-0.5 ${warn ? "text-yellow-400" : "text-zinc-200"}`}>{value}</div>
    </div>
  );
}
