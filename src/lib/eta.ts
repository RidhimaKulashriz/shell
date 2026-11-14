// ETA = travel (routes) + gate wait + walk gate->tower + lift & floor time + buffer.
// Gate wait and lift time are learned per society from real jobs (exponential moving average).

export type EtaInput = { travelMin: number; gateWaitMin: number; walkMin: number; floor: number; liftBaseMin?: number; liftPerFloorSec?: number; bufferMin?: number };
export type EtaBreakdown = { travel: number; gate: number; walk: number; lift: number; buffer: number; total: number };

export function computeEta(i: EtaInput): EtaBreakdown {
  const lift = (i.liftBaseMin ?? 1) + (Math.max(0, i.floor) * (i.liftPerFloorSec ?? 4)) / 60;
  const buffer = i.bufferMin ?? 2;
  const parts = { travel: i.travelMin, gate: i.gateWaitMin, walk: i.walkMin, lift: Math.round(lift * 10) / 10, buffer };
  return { ...parts, total: Math.ceil(parts.travel + parts.gate + parts.walk + parts.lift + parts.buffer) };
}

export type SocietyLearning = { gateWaitMin: number; liftPerFloorSec: number; samples: number };
export function learn(prev: SocietyLearning, observed: { gateWaitMin?: number; liftPerFloorSec?: number }, alpha = 0.2): SocietyLearning {
  const a = prev.samples < 5 ? 0.4 : alpha;
  return {
    gateWaitMin: observed.gateWaitMin === undefined ? prev.gateWaitMin : +(prev.gateWaitMin * (1 - a) + observed.gateWaitMin * a).toFixed(2),
    liftPerFloorSec: observed.liftPerFloorSec === undefined ? prev.liftPerFloorSec : +(prev.liftPerFloorSec * (1 - a) + observed.liftPerFloorSec * a).toFixed(2),
    samples: prev.samples + 1,
  };
}

export type EtaStage = "far" | "t15" | "t5" | "arrived";
export function etaStage(minutes: number, arrived = false): EtaStage {
  if (arrived || minutes <= 0) return "arrived";
  if (minutes <= 5) return "t5";
  if (minutes <= 15) return "t15";
  return "far";
}

export function shouldTriggerBackup(delayMin: number, thresholdMin = 10) {
  return delayMin >= thresholdMin;
}

/** "Rahul is at Gate 2, about 6 min, Tower C 9th floor" */
export function etaLine(name: string, where: string, minutes: number, tower: string, floor: number) {
  const ord = (n: number) => `${n}${["th", "st", "nd", "rd"][(n % 100 >= 11 && n % 100 <= 13) || n % 10 > 3 ? 0 : n % 10]}`;
  return `${name} is at ${where}, about ${minutes} min, ${tower} ${ord(floor)} floor`;
}
