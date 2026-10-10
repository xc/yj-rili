export type BoxSample = {
  time: number | string;
  conf: number;
  /** `[left, top, right, bottom]` in source-frame pixels. */
  xyxy: [number, number, number, number];
};

export type ComponentRow = {
  _id: string;
  _start_time: string;
  _end_time: string;
  track_id: string | number;
  name: string;
  /** Parent interval end, seconds from the start of the video. */
  end?: number;
  duration: number;
  max_conf: number;
  frames: number;
  boxes: BoxSample[];
};

export type FrameSize = {
  width: number;
  height: number;
};

export type VisibleBox = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function timeToSeconds(value: string) {
  const parts = value.split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] ?? 0;
}

function sampleTime(value: number | string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return Number.NaN;
  }
  const numeric = Number(value);
  if (value.trim() !== "" && Number.isFinite(numeric) && !value.includes(":")) {
    return numeric;
  }
  return timeToSeconds(value);
}

function readXyxy(value: unknown): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length < 4) {
    return null;
  }
  const coords = value.slice(0, 4).map(Number);
  if (coords.some((coord) => !Number.isFinite(coord))) {
    return null;
  }
  return coords as [number, number, number, number];
}

function intervalEnd(row: ComponentRow) {
  if (typeof row.end === "number" && Number.isFinite(row.end)) {
    return row.end;
  }
  return timeToSeconds(row._end_time);
}

/**
 * Each sample is held until the next sample. The last sample stays visible
 * until the parent interval `end`. Nothing is drawn before the first sample.
 */
export function visibleBoxes(rows: ComponentRow[], time: number): VisibleBox[] {
  const visible: VisibleBox[] = [];
  for (const row of rows) {
    const samples = (row.boxes ?? [])
      .map((box) => ({
        box,
        at: sampleTime(box.time),
        xyxy: readXyxy(box.xyxy),
      }))
      .filter(
        (
          sample,
        ): sample is {
          box: BoxSample;
          at: number;
          xyxy: [number, number, number, number];
        } => Number.isFinite(sample.at) && sample.xyxy !== null,
      )
      .sort((left, right) => left.at - right.at);
    if (samples.length === 0) {
      continue;
    }
    const end = intervalEnd(row);
    if (time < samples[0].at || time > end) {
      continue;
    }
    let chosen = samples[0];
    for (const sample of samples) {
      if (sample.at <= time) {
        chosen = sample;
      } else {
        break;
      }
    }
    const [x1, y1, x2, y2] = chosen.xyxy;
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    if (width === 0 || height === 0) {
      continue;
    }
    visible.push({
      id: row._id,
      name: row.name,
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width,
      height,
    });
  }
  return visible;
}

export function boxPercents(box: VisibleBox, frame: FrameSize) {
  return {
    left: (box.x / frame.width) * 100,
    top: (box.y / frame.height) * 100,
    width: (box.width / frame.width) * 100,
    height: (box.height / frame.height) * 100,
  };
}
