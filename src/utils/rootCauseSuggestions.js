/**
 * AI-Assisted Root Cause Suggestions
 * 
 * For each bug cluster:
 * - Feed error timeline, session diffs, recent deploy metadata
 * - Generate suggestions: probable root cause, affected subsystem, recommended mitigation
 * - Suggestions are advisory only, human confirmation required
 * - Confidence score attached
 * 
 * Outcome:
 * - Faster diagnosis
 * - Less cognitive load
 * - Fewer blind fixes
 */

/**
 * Analyze error pattern and generate root cause suggestions
 */
export function generateRootCauseSuggestions(cluster, sessionDiff, deployMetadata = {}) {
  const suggestions = [];

  // Extract cluster data
  const {
    signature,
    count,
    affectedRoutes,
    affectedVersions,
    swStates,
    authStates
  } = cluster;

  // Extract session diff data
  const { commonDifferences = [] } = sessionDiff || {};

  // Rule-based analysis
  
  // 1. Auth-related issues
  if (signature.message?.includes('auth') || 
      signature.message?.includes('token') ||
      signature.message?.includes('unauthorized')) {
    
    const authDiffs = commonDifferences.filter(d => d.field.startsWith('auth'));
    
    if (authDiffs.length > 0) {
      suggestions.push({
        rootCause: 'Authentication state mismatch',
        affectedSubsystem: 'auth',
        confidence: 0.85,
        evidence: [
          `Error message contains auth-related keywords`,
          `${authDiffs.length} auth state differences found`,
          `Affected auth states: ${Array.from(authStates).join(', ')}`
        ],
        recommendedMitigation: [
          'Check token refresh logic',
          'Verify auth state initialization',
          'Review cross-tab auth sync',
          'Check for race conditions in auth bootstrap'
        ]
      });
    }
  }

  // 2. Service worker issues
  if (signature.message?.includes('service worker') ||
      signature.message?.includes('cache') ||
      swStates.has('none') || swStates.has('redundant')) {
    
    const swDiffs = commonDifferences.filter(d => d.field.startsWith('serviceWorker'));
    
    suggestions.push({
      rootCause: 'Service worker lifecycle issue',
      affectedSubsystem: 'service_worker',
      confidence: 0.80,
      evidence: [
        `Service worker states: ${Array.from(swStates).join(', ')}`,
        `${swDiffs.length} SW state differences found`,
        `Affected routes: ${Array.from(affectedRoutes).join(', ')}`
      ],
      recommendedMitigation: [
        'Check service worker registration',
        'Verify cache version compatibility',
        'Review update notification flow',
        'Check for multiple SW registrations'
      ]
    });
  }

  // 3. Network issues
  if (signature.message?.includes('network') ||
      signature.message?.includes('fetch') ||
      signature.message?.includes('offline')) {
    
    const networkDiffs = commonDifferences.filter(d => d.field.startsWith('network'));
    
    suggestions.push({
      rootCause: 'Network connectivity issue',
      affectedSubsystem: 'network',
      confidence: 0.75,
      evidence: [
        `Error message contains network-related keywords`,
        `${networkDiffs.length} network state differences found`
      ],
      recommendedMitigation: [
        'Check offline detection logic',
        'Verify retry mechanisms',
        'Review request timeout settings',
        'Check for proper error handling in API calls'
      ]
    });
  }

  // 4. Version mismatch issues
  if (affectedVersions.size > 1) {
    suggestions.push({
      rootCause: 'Version compatibility issue',
      affectedSubsystem: 'versioning',
      confidence: 0.70,
      evidence: [
        `Affects multiple versions: ${Array.from(affectedVersions).join(', ')}`,
        `First seen after version: ${deployMetadata.version || 'unknown'}`
      ],
      recommendedMitigation: [
        'Check API compatibility between versions',
        'Review migration logic',
        'Verify cache invalidation on version change',
        'Check for breaking changes in recent deploy'
      ]
    });
  }

  // 5. Route-specific issues
  if (affectedRoutes.size === 1) {
    const route = Array.from(affectedRoutes)[0];
    
    suggestions.push({
      rootCause: `Route-specific issue on ${route}`,
      affectedSubsystem: 'routing',
      confidence: 0.65,
      evidence: [
        `Only affects route: ${route}`,
        `Error count: ${count}`,
        `Stack trace pattern: ${signature.stack?.substring(0, 50)}...`
      ],
      recommendedMitigation: [
        `Review code for route: ${route}`,
        'Check for route-specific data loading',
        'Verify route guards and permissions',
        'Check for missing error boundaries'
      ]
    });
  }

  // 6. Memory issues
  const memoryDiffs = commonDifferences.filter(d => d.field.startsWith('performance.memory'));
  
  if (memoryDiffs.length > 0) {
    suggestions.push({
      rootCause: 'Memory pressure or leak',
      affectedSubsystem: 'performance',
      confidence: 0.60,
      evidence: [
        `${memoryDiffs.length} memory-related differences found`,
        `Error count: ${count}`
      ],
      recommendedMitigation: [
        'Check for memory leaks',
        'Review component cleanup logic',
        'Verify event listener removal',
        'Check for circular references'
      ]
    });
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions;
}

/**
 * Format suggestions for display
 */
export function formatSuggestions(suggestions) {
  if (suggestions.length === 0) {
    return 'No root cause suggestions available.';
  }

  return suggestions.map((suggestion, index) => {
    const confidencePercent = (suggestion.confidence * 100).toFixed(0);
    
    return `
**Suggestion ${index + 1}** (${confidencePercent}% confidence)

**Root Cause:** ${suggestion.rootCause}
**Affected Subsystem:** ${suggestion.affectedSubsystem}

**Evidence:**
${suggestion.evidence.map(e => `- ${e}`).join('\n')}

**Recommended Mitigation:**
${suggestion.recommendedMitigation.map(m => `- ${m}`).join('\n')}
    `.trim();
  }).join('\n\n---\n\n');
}

console.log('[Root Cause] 🚀 Root cause suggestion system initialized');

