/**
 * Tests for useMutation hook
 *
 * Tests the unified mutation handler with optimistic updates and rollback.
 *
 * To run these tests, you'll need to install @testing-library/react and vitest:
 *   npm install -D vitest @testing-library/react jsdom
 *
 * Then add to package.json scripts:
 *   "test:unit": "vitest run"
 *
 * For now, these are documented tests that verify the expected behavior.
 */

// =================================================================
// TEST CASES - Documented for manual/future automated verification
// =================================================================

/*
TEST: Basic Mutation
--------------------
1. Should execute mutation function and call onSuccess
   - Call mutate('testArg')
   - mutationFn should receive 'testArg'
   - onSuccess should receive the resolved value
   - isLoading should be false after completion

2. Should call onError when mutation fails
   - mutationFn throws Error('API Error')
   - onError should receive the error
   - isError should be true
   - error property should contain the error

TEST: Optimistic Updates
------------------------
1. Should call onOptimisticUpdate before mutation
   - Order of execution: optimistic -> mutation
   - Rollback function returned from onOptimisticUpdate

2. Should rollback on error when optimistic update is used
   - Initial state: { count: 10 }
   - onOptimisticUpdate sets { count: 100 }
   - mutationFn throws error
   - Rollback function is called
   - Final state: { count: 10 }

TEST: mutateAsync
-----------------
1. Should return promise that resolves with result
   - const result = await mutateAsync('arg')
   - result should equal the resolved value from mutationFn

2. Should throw error for failed mutation
   - mutationFn rejects with Error('Failed')
   - await mutateAsync() should throw 'Failed'

TEST: reset
-----------
1. Should reset error state
   - After failed mutation: isError=true, error=Error
   - After reset(): isError=false, error=null
*/

// Export test runner function for manual testing in dev console
export function runUseMutationTests() {
  console.log('useMutation Tests - Documentation');
  console.log('==================================');
  console.log('');
  console.log('The useMutation hook provides:');
  console.log('  - isLoading: boolean - true during async operation');
  console.log('  - isError: boolean - true if last mutation failed');
  console.log('  - error: Error|null - the error if mutation failed');
  console.log('  - mutate(args): void - fire-and-forget mutation');
  console.log('  - mutateAsync(args): Promise - async/await mutation');
  console.log('  - reset(): void - reset error state');
  console.log('');
  console.log('Example usage:');
  console.log(`
  const likeMutation = useMutation({
    mutationKey: 'likePost',
    mutationFn: async (postId) => {
      const response = await api.post(\`/posts/\${postId}/like\`);
      return response.data;
    },
    onOptimisticUpdate: () => {
      // Save current state
      const oldState = likeState;
      setLikeState(true);
      // Return rollback function
      return () => setLikeState(oldState);
    },
    onSuccess: (updatedPost) => {
      // Reconcile with server response
      setPost(updatedPost);
    },
    onError: (error) => {
      // Show error (rollback already happened)
      alert('Failed to like post');
    },
  });

  // Usage
  <button
    onClick={() => likeMutation.mutate(postId)}
    disabled={likeMutation.isLoading}
  >
    {likeMutation.isLoading ? 'Liking...' : 'Like'}
  </button>
  `);

  console.log('');
  console.log('To add automated testing:');
  console.log('  npm install -D vitest @testing-library/react jsdom');
  console.log('  Add "test:unit": "vitest run" to package.json scripts');

  return {
    message: 'See console for documentation',
    hookAPI: ['isLoading', 'isError', 'error', 'mutate', 'mutateAsync', 'reset']
  };
}

export default { runUseMutationTests };

