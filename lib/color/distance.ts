import { differenceCiede2000 } from "culori";
import type { LabColor } from "./space";

const ciede2000 = differenceCiede2000();

export function deltaE(a: LabColor, b: LabColor): number {
  return ciede2000(
    { mode: "lab", l: a.l, a: a.a, b: a.b },
    { mode: "lab", l: b.l, a: b.a, b: b.b }
  );
}
