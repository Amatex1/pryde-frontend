import { describe, expect, it } from 'vitest';
import useMutation, {
  createMutationHandler,
  useMutation as namedUseMutation,
  withMutationGuard,
} from '../useMutation';

describe('useMutation module', () => {
  it('exports the mutation helpers', () => {
    expect(typeof useMutation).toBe('function');
    expect(namedUseMutation).toBe(useMutation);
    expect(typeof createMutationHandler).toBe('function');
    expect(typeof withMutationGuard).toBe('function');
  });
});

