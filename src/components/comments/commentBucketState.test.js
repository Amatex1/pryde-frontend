import { describe, expect, it } from 'vitest';
import {
  appendUniqueCommentToBucket,
  mapCommentsInBuckets,
  removeBucket,
  removeCommentFromAllBuckets,
  removeCommentFromBucket,
  replaceCommentInBuckets,
  replaceCommentsInBuckets,
} from './commentBucketState';

describe('commentBucketState helpers', () => {
  it('replaces matching comments across every bucket', () => {
    const updated = { _id: 'comment-2', content: 'updated' };
    const buckets = {
      postA: [{ _id: 'comment-1', content: 'a' }, { _id: 'comment-2', content: 'b' }],
      postB: [{ _id: 'comment-2', content: 'old' }],
    };

    expect(replaceCommentInBuckets(buckets, updated)).toEqual({
      postA: [{ _id: 'comment-1', content: 'a' }, updated],
      postB: [updated],
    });
  });

  it('appends unique comments without duplicating existing entries', () => {
    const comment = { _id: 'comment-1', content: 'hello' };
    const buckets = { postA: [comment] };

    expect(appendUniqueCommentToBucket(buckets, 'postA', comment)).toBe(buckets);
    expect(appendUniqueCommentToBucket({}, 'postA', comment)).toEqual({ postA: [comment] });
  });

  it('maps comments only when the mapper changes a bucket entry', () => {
    const buckets = { postA: [{ _id: 'comment-1', liked: false }] };
    const unchanged = mapCommentsInBuckets(buckets, (comment) => comment);
    const changed = mapCommentsInBuckets(buckets, (comment) => ({ ...comment, liked: true }));

    expect(unchanged).toBe(buckets);
    expect(changed).toEqual({ postA: [{ _id: 'comment-1', liked: true }] });
  });

  it('removes comments from one or many buckets and clears parent buckets', () => {
    const buckets = {
      postA: [{ _id: 'comment-1' }, { _id: 'comment-2' }],
      'comment-1': [{ _id: 'reply-1' }],
      'comment-2': [{ _id: 'reply-2' }, { _id: 'reply-3' }],
    };

    expect(removeCommentFromBucket(buckets, 'postA', 'comment-2')).toEqual({
      ...buckets,
      postA: [{ _id: 'comment-1' }],
    });
    expect(removeCommentFromAllBuckets(buckets, 'reply-2')).toEqual({
      postA: [{ _id: 'comment-1' }, { _id: 'comment-2' }],
      'comment-1': [{ _id: 'reply-1' }],
      'comment-2': [{ _id: 'reply-3' }],
    });
    expect(removeBucket(buckets, 'comment-1')).toEqual({
      postA: [{ _id: 'comment-1' }, { _id: 'comment-2' }],
      'comment-2': [{ _id: 'reply-2' }, { _id: 'reply-3' }],
    });
  });

  it('replaces multiple comments and removes multiple deleted ids', () => {
    const buckets = {
      postA: [{ _id: 'comment-1', content: 'a' }, { _id: 'comment-2', content: 'b' }],
      postB: [{ _id: 'comment-3', content: 'c' }],
    };

    expect(replaceCommentsInBuckets(buckets, [{ _id: 'comment-3', content: 'updated' }])).toEqual({
      postA: [{ _id: 'comment-1', content: 'a' }, { _id: 'comment-2', content: 'b' }],
      postB: [{ _id: 'comment-3', content: 'updated' }],
    });
    expect(removeCommentFromAllBuckets(buckets, 'comment-2')).toEqual({
      postA: [{ _id: 'comment-1', content: 'a' }],
      postB: [{ _id: 'comment-3', content: 'c' }],
    });
  });
});