import { describe, expect, it } from 'vitest';
import {
  createMutationHeaders,
  detectStateMismatch,
  generateMutationId,
} from '../consistencyGuard';

describe('consistencyGuard module', () => {
  it('generates traceable mutation ids and headers', () => {
    const mutationId = generateMutationId();
    const headers = createMutationHeaders(mutationId);

    expect(mutationId).toMatch(/^mut_/);
    expect(headers).toMatchObject({
      'X-Mutation-Id': mutationId,
      _mutationId: mutationId,
    });
  });

  it('reports matching state when local and server ids align', () => {
    const result = detectStateMismatch(
      'post',
      [{ _id: '1' }, { _id: '2' }],
      [{ _id: '1' }, { _id: '2' }],
    );

    expect(result).toEqual({ matches: true, mismatches: [] });
  });
});

