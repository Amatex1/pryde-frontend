/**
 * Mutation Guard Utility
 *
 * Prevents mutations on non-persisted entities and ensures
 * all state-changing operations go through a consistent lifecycle:
 *
 * 1. pending   - Action initiated, awaiting backend response
 * 2. confirmed - Backend success, entity is persisted
 * 3. rejected  - Backend failed, rollback UI and block dependent actions
 *
 * CRITICAL: This eliminates the entire class of "ghost entity" bugs where
 * UI reflects state that doesn't exist on the server.
 */

const isDev = import.meta.env.DEV;

/**
 * Entity state tracking
 * Maps entity IDs to their persistence state
 */
const entityStates = new Map();

/**
 * Entity state enum
 */
export const EntityState = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected'
};

/**
 * Mark an entity as pending (creation initiated, awaiting confirmation)
 * @param {string} entityType - Type of entity (e.g., 'draft', 'post', 'comment')
 * @param {string} tempId - Temporary/optimistic ID
 */
export function markPending(entityType, tempId) {
  const key = `${entityType}:${tempId}`;
  entityStates.set(key, {
    state: EntityState.PENDING,
    createdAt: Date.now(),
    entityType,
    tempId,
    confirmedId: null
  });

  if (isDev) {
    console.log(`[MUTATION GUARD] Entity marked as pending: ${key}`);
  }
}

/**
 * Mark an entity as confirmed (backend returned success with ID)
 * @param {string} entityType - Type of entity
 * @param {string} tempId - Original temporary ID (null if no temp ID was used)
 * @param {string} confirmedId - Backend-confirmed ID
 */
export function markConfirmed(entityType, tempId, confirmedId) {
  const key = tempId ? `${entityType}:${tempId}` : `${entityType}:${confirmedId}`;
  const existing = entityStates.get(key);

  entityStates.set(`${entityType}:${confirmedId}`, {
    state: EntityState.CONFIRMED,
    createdAt: existing?.createdAt || Date.now(),
    confirmedAt: Date.now(),
    entityType,
    tempId,
    confirmedId
  });

  // Remove temp ID entry if different from confirmed ID
  if (tempId && tempId !== confirmedId) {
    entityStates.delete(key);
  }

  if (isDev) {
    console.log(`[MUTATION GUARD] Entity confirmed: ${entityType}:${confirmedId}`);
  }
}

/**
 * Mark an entity as rejected (backend returned failure)
 * @param {string} entityType - Type of entity
 * @param {string} tempId - Temporary ID that was rejected
 * @param {string} reason - Rejection reason
 */
export function markRejected(entityType, tempId, reason = 'Unknown error') {
  const key = `${entityType}:${tempId}`;

  entityStates.set(key, {
    state: EntityState.REJECTED,
    createdAt: entityStates.get(key)?.createdAt || Date.now(),
    rejectedAt: Date.now(),
    entityType,
    tempId,
    confirmedId: null,
    reason
  });

  if (isDev) {
    console.warn(`[MUTATION GUARD] Entity rejected: ${key}`);
    console.warn(`[MUTATION GUARD] Reason: ${reason}`);
    console.warn(`[MUTATION GUARD] Dependent actions (delete, edit) will be blocked.`);
  }
}

/**
 * Check if an entity is confirmed (safe to mutate)
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID to check
 * @returns {boolean} True if entity is confirmed
 */
export function isConfirmed(entityType, entityId) {
  if (!entityId) return false;
  const key = `${entityType}:${entityId}`;
  const entry = entityStates.get(key);
  return entry?.state === EntityState.CONFIRMED;
}

/**
 * Check if an entity exists in tracking (any state)
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID to check
 * @returns {boolean} True if entity is tracked
 */
export function isTracked(entityType, entityId) {
  if (!entityId) return false;
  const key = `${entityType}:${entityId}`;
  return entityStates.has(key);
}

/**
 * Get entity state
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @returns {string|null} Entity state or null if not tracked
 */
export function getEntityState(entityType, entityId) {
  if (!entityId) return null;
  const key = `${entityType}:${entityId}`;
  return entityStates.get(key)?.state || null;
}

/**
 * Clear entity from tracking (e.g., after successful delete)
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 */
export function clearEntity(entityType, entityId) {
  if (!entityId) return;
  const key = `${entityType}:${entityId}`;
  entityStates.delete(key);

  if (isDev) {
    console.log(`[MUTATION GUARD] Entity cleared: ${key}`);
  }
}

/**
 * Guard a mutation - blocks if entity not confirmed
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID to mutate
 * @param {string} action - Action being attempted (e.g., 'delete', 'edit')
 * @returns {{allowed: boolean, reason?: string}} Guard result
 */
export function guardMutation(entityType, entityId, action) {
  // No ID means no entity to mutate
  if (!entityId) {
    if (isDev) {
      console.warn(`⚠️ Attempted ${action} on ${entityType} with no ID`);
      console.warn('This action will fail on refresh.');
    }
    return {
      allowed: false,
      reason: `Cannot ${action} ${entityType}: No ID provided`
    };
  }

  const key = `${entityType}:${entityId}`;
  const entry = entityStates.get(key);

  // If not tracked at all, check if it looks like a backend ID
  // MongoDB ObjectIds are 24 hex characters
  if (!entry) {
    const looksLikeMongoId = /^[a-f0-9]{24}$/i.test(entityId);

    // If it looks like a valid MongoDB ID, assume it's from the server
    // This handles entities fetched from the server (not created in this session)
    if (looksLikeMongoId) {
      if (isDev) {
        console.log(`[MUTATION GUARD] ${entityType}:${entityId} not tracked but looks like valid ID - allowing`);
      }
      return { allowed: true };
    }

    if (isDev) {
      console.warn(`⚠️ Attempted ${action} on non-tracked entity: ${key}`);
      console.warn('This entity was never confirmed by the backend.');
    }
    return {
      allowed: false,
      reason: `Cannot ${action} ${entityType}: Entity not found or never persisted`
    };
  }

  // Check state
  switch (entry.state) {
    case EntityState.CONFIRMED:
      return { allowed: true };

    case EntityState.PENDING:
      if (isDev) {
        console.warn(`⚠️ Attempted ${action} on pending ${entityType}: ${entityId}`);
        console.warn('Entity is still being created. Wait for confirmation.');
      }
      return {
        allowed: false,
        reason: `Cannot ${action} ${entityType}: Still being saved`
      };

    case EntityState.REJECTED:
      if (isDev) {
        console.warn(`⚠️ Attempted ${action} on rejected ${entityType}: ${entityId}`);
        console.warn('This entity failed to save. It only exists locally.');
        console.warn(`Original rejection reason: ${entry.reason}`);
      }
      return {
        allowed: false,
        reason: `Cannot ${action} ${entityType}: Failed to save originally`
      };

    default:
      return { allowed: false, reason: 'Unknown entity state' };
  }
}

/**
 * Wrapper for async mutations with automatic state management
 * @param {Object} options - Mutation options
 * @param {string} options.entityType - Type of entity
 * @param {string} options.entityId - Entity ID (null for create operations)
 * @param {string} options.action - Action name ('create', 'update', 'delete')
 * @param {Function} options.mutation - Async mutation function
 * @param {Function} options.onSuccess - Success callback (receives response)
 * @param {Function} options.onError - Error callback (receives error)
 * @param {Function} options.onBlocked - Called if mutation is blocked
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function executeMutation({
  entityType,
  entityId,
  action,
  mutation,
  onSuccess,
  onError,
  onBlocked
}) {
  // For non-create actions, check if mutation is allowed
  if (action !== 'create' && entityId) {
    const guard = guardMutation(entityType, entityId, action);
    if (!guard.allowed) {
      if (onBlocked) onBlocked(guard.reason);
      return { success: false, error: guard.reason, blocked: true };
    }
  }

  try {
    // For create actions, mark as pending
    const tempId = action === 'create' ? `temp_${Date.now()}` : null;
    if (tempId) {
      markPending(entityType, tempId);
    }

    // Execute the mutation
    const response = await mutation();

    // Handle create confirmation
    if (action === 'create' && response?._id) {
      markConfirmed(entityType, tempId, response._id);
    }

    // Handle delete cleanup
    if (action === 'delete') {
      clearEntity(entityType, entityId);
    }

    if (onSuccess) onSuccess(response);
    return { success: true, data: response };

  } catch (error) {
    // Mark as rejected for create actions
    if (action === 'create') {
      markRejected(entityType, `temp_${Date.now()}`, error.message);
    }

    if (onError) onError(error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all tracked entities (e.g., on logout)
 */
export function clearAllEntities() {
  entityStates.clear();
  if (isDev) {
    console.log('[MUTATION GUARD] All entities cleared');
  }
}

/**
 * Get debug info for all tracked entities (dev only)
 */
export function getDebugInfo() {
  if (!isDev) return null;

  const info = {};
  entityStates.forEach((value, key) => {
    info[key] = { ...value };
  });
  return info;
}

export default {
  EntityState,
  markPending,
  markConfirmed,
  markRejected,
  isConfirmed,
  isTracked,
  getEntityState,
  clearEntity,
  guardMutation,
  executeMutation,
  clearAllEntities,
  getDebugInfo
};
