import type { Position } from "geojson";
import { forward } from "mgrs";
import { CoordinateFormat, toStringHDMS } from "ol/coordinate";
import { CoordinateFormatType } from "@/composables/geoShowLocation";

export function formatDecimalDegrees(p: Position, precision: number) {
  const [lon, lat] = p;
  return `${Math.abs(lat).toFixed(precision)}° ${lat >= 0 ? "N" : "S"} ${Math.abs(
    lon
  ).toFixed(precision)}° ${lon >= 0 ? "E" : "W"}`;
}

export function formatMGRS(p: Position | undefined, precision: 1 | 2 | 3 | 4 | 5 = 5) {
  if (!p) return "";
  const mgrs: string = p && forward(p as [number, number], precision);
  const n = mgrs.length;
  const eastingI = n - precision * 2;
  return `${mgrs.slice(0, eastingI - 2)} ${mgrs.slice(
    eastingI - 2,
    eastingI
  )} ${mgrs.slice(eastingI, n - precision)} ${mgrs.slice(n - precision)}`;
}

export function getCoordinateFormatFunction(
  format: CoordinateFormatType
): CoordinateFormat {
  if (format === "DegreeMinuteSeconds") return (v: any) => toStringHDMS(v, 0);
  if (format === "MGRS") return (v: any) => formatMGRS(v, 4);
  return (v: any) => formatDecimalDegrees(v, 3);
}
