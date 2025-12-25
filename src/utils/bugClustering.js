/**
 * Bug Clustering System
 * 
 * Automatically groups errors by:
 * - Error signature (message + stack trace pattern)
 * - Route
 * - App version
 * - Service worker state
 * - Auth state
 * 
 * Detects recurring patterns and assigns cluster IDs
 * 
 * Outcome:
 * - 100 similar bugs become 1 actionable issue
 * - No manual log spelunking
 */

import crypto from 'crypto-js';

// In-memory cluster storage
const errorClusters = new Map();

// Cluster retention time (24 hours)
const CLUSTER_RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * Generate error signature
 */
function generateErrorSignature(error, context = {}) {
  const {
    route = 'unknown',
    appVersion = 'unknown',
    swState = 'unknown',
    authState = 'unknown'
  } = context;

  // Normalize error message (remove dynamic parts)
  const normalizedMessage = error.message
    ?.replace(/\d+/g, 'N') // Replace numbers with N
    ?.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // Replace UUIDs
    ?.replace(/https?:\/\/[^\s]+/g, 'URL') // Replace URLs
    || 'unknown';

  // Extract stack trace pattern (first 3 lines)
  const stackPattern = error.stack
    ?.split('\n')
    ?.slice(0, 3)
    ?.map(line => line.trim().replace(/:\d+:\d+/g, ':N:N')) // Remove line/column numbers
    ?.join('|')
    || 'unknown';

  // Create signature object
  const signatureObj = {
    message: normalizedMessage,
    stack: stackPattern,
    route,
    appVersion,
    swState,
    authState
  };

  // Generate hash
  const signatureString = JSON.stringify(signatureObj);
  const signature = crypto.SHA256(signatureString).toString();

  return {
    signature,
    signatureObj
  };
}

/**
 * Add error to cluster
 */
export function clusterError(error, context = {}) {
  const { signature, signatureObj } = generateErrorSignature(error, context);

  // Get or create cluster
  let cluster = errorClusters.get(signature);

  if (!cluster) {
    cluster = {
      id: signature,
      signature: signatureObj,
      errors: [],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      count: 0,
      affectedRoutes: new Set(),
      affectedVersions: new Set(),
      swStates: new Set(),
      authStates: new Set()
    };
    errorClusters.set(signature, cluster);
    console.log(`[Bug Clustering] 🆕 New cluster created: ${signature.substring(0, 8)}`);
  }

  // Add error to cluster
  cluster.errors.push({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context,
    timestamp: Date.now()
  });

  // Update cluster metadata
  cluster.lastSeen = Date.now();
  cluster.count++;
  cluster.affectedRoutes.add(context.route || 'unknown');
  cluster.affectedVersions.add(context.appVersion || 'unknown');
  cluster.swStates.add(context.swState || 'unknown');
  cluster.authStates.add(context.authState || 'unknown');

  console.log(`[Bug Clustering] 📊 Error added to cluster ${signature.substring(0, 8)} (count: ${cluster.count})`);

  return {
    clusterId: signature,
    clusterCount: cluster.count,
    isRecurring: cluster.count > 1
  };
}

/**
 * Get cluster by ID
 */
export function getCluster(clusterId) {
  return errorClusters.get(clusterId);
}

/**
 * Get all clusters
 */
export function getAllClusters() {
  return Array.from(errorClusters.values()).map(cluster => ({
    id: cluster.id,
    signature: cluster.signature,
    count: cluster.count,
    firstSeen: cluster.firstSeen,
    lastSeen: cluster.lastSeen,
    affectedRoutes: Array.from(cluster.affectedRoutes),
    affectedVersions: Array.from(cluster.affectedVersions),
    swStates: Array.from(cluster.swStates),
    authStates: Array.from(cluster.authStates)
  }));
}

/**
 * Get top clusters by count
 */
export function getTopClusters(limit = 10) {
  return getAllClusters()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get recent clusters
 */
export function getRecentClusters(limit = 10) {
  return getAllClusters()
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, limit);
}

/**
 * Get cluster summary
 */
export function getClusterSummary() {
  const clusters = getAllClusters();

  return {
    totalClusters: clusters.length,
    totalErrors: clusters.reduce((sum, c) => sum + c.count, 0),
    recurringClusters: clusters.filter(c => c.count > 1).length,
    topClusters: getTopClusters(5),
    recentClusters: getRecentClusters(5)
  };
}

/**
 * Clean up old clusters
 */
function cleanupOldClusters() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [signature, cluster] of errorClusters.entries()) {
    if (now - cluster.lastSeen > CLUSTER_RETENTION_MS) {
      errorClusters.delete(signature);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[Bug Clustering] 🗑️ Cleaned up ${cleanedCount} old clusters`);
  }
}

// Start cleanup interval (every hour)
setInterval(cleanupOldClusters, 60 * 60 * 1000);

console.log('[Bug Clustering] 🚀 Bug clustering system initialized');

