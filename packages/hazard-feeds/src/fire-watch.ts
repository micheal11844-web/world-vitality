import { capClusters, clusterFires } from "./fires.js";
import { CameraIndex } from "./geo.js";
import type { CameraNearPoint, FireCluster, FireDetectionPoint, PublicCamera } from "./types.js";

/** A fire cluster together with the public cameras closest to it. */
export interface GlobeFire extends FireCluster {
  /** Nearest first; empty when no camera of a known provider is within range. */
  nearby: CameraNearPoint[];
}

export interface FireWatch {
  fires: GlobeFire[];
  /** Detections kept after dropping low-confidence ones (before folding into clusters). */
  totalDetections: number;
  /** Clusters before the cap, so the page can say "showing N of M". */
  totalClusters: number;
}

export const DEFAULT_MAX_FIRES = 2500;
export const NEARBY_CAMERA_RADIUS_KM = 25;
export const NEARBY_CAMERA_LIMIT = 4;

/**
 * Everything the Globe needs about fires, from one day of detections and the
 * current camera list: fold detections into clusters, find each cluster's
 * nearest public cameras, and cap the list. Clusters that have a camera
 * nearby are always kept (they are the ones a person can check by eye); the
 * rest of the allowance goes to the strongest.
 */
export function buildFireWatch(
  points: readonly FireDetectionPoint[],
  cameras: readonly PublicCamera[],
  {
    maxFires = DEFAULT_MAX_FIRES,
    radiusKm = NEARBY_CAMERA_RADIUS_KM,
    nearbyLimit = NEARBY_CAMERA_LIMIT,
    cellDegrees = 0.1,
  }: { maxFires?: number; radiusKm?: number; nearbyLimit?: number; cellDegrees?: number } = {},
): FireWatch {
  const clusters = clusterFires(points, { cellDegrees });
  const index = new CameraIndex(cameras);
  const nearby = new Map<string, CameraNearPoint[]>();
  if (cameras.length > 0) {
    for (const cluster of clusters) {
      const found = index.near(cluster.latitude, cluster.longitude, {
        radiusKm,
        limit: nearbyLimit,
      });
      if (found.length > 0) nearby.set(cluster.id, found);
    }
  }
  const kept = capClusters(clusters, maxFires, (cluster) => nearby.has(cluster.id));
  return {
    fires: kept.map((cluster) => ({ ...cluster, nearby: nearby.get(cluster.id) ?? [] })),
    totalDetections: clusters.reduce((sum, cluster) => sum + cluster.count, 0),
    totalClusters: clusters.length,
  };
}
