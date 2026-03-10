export function mapCommentsInBuckets(buckets, mapper) {
  let hasChanges = false;
  const nextBuckets = { ...buckets };

  Object.keys(nextBuckets).forEach((bucketId) => {
    let bucketChanged = false;
    const mappedBucket = (nextBuckets[bucketId] || []).map((comment) => {
      const mappedComment = mapper(comment);
      if (mappedComment !== comment) bucketChanged = true;
      return mappedComment;
    });

    if (bucketChanged) {
      nextBuckets[bucketId] = mappedBucket;
      hasChanges = true;
    }
  });

  return hasChanges ? nextBuckets : buckets;
}

export function replaceCommentsInBuckets(buckets, updatedComments) {
  const replacements = new Map(
    (updatedComments || []).filter(Boolean).map((comment) => [comment._id, comment])
  );

  if (replacements.size === 0) return buckets;

  return mapCommentsInBuckets(buckets, (comment) => replacements.get(comment._id) || comment);
}

export function replaceCommentInBuckets(buckets, updatedComment) {
  return replaceCommentsInBuckets(buckets, updatedComment ? [updatedComment] : []);
}

export function appendUniqueCommentToBucket(buckets, bucketId, comment) {
  const existing = buckets[bucketId] || [];
  if (existing.some((entry) => entry._id === comment._id)) return buckets;

  return {
    ...buckets,
    [bucketId]: [...existing, comment],
  };
}

export function removeCommentFromBucket(buckets, bucketId, commentId) {
  const existing = buckets[bucketId] || [];
  const filtered = existing.filter((comment) => comment._id !== commentId);

  if (filtered.length === existing.length) return buckets;

  return {
    ...buckets,
    [bucketId]: filtered,
  };
}

export function removeCommentsFromAllBuckets(buckets, commentIds) {
  const deletedIds = commentIds instanceof Set ? commentIds : new Set(commentIds || []);
  if (deletedIds.size === 0) return buckets;

  let hasChanges = false;
  const nextBuckets = { ...buckets };

  Object.keys(nextBuckets).forEach((bucketId) => {
    const existing = nextBuckets[bucketId] || [];
    const filtered = existing.filter((comment) => !deletedIds.has(comment._id));
    if (filtered.length !== existing.length) {
      nextBuckets[bucketId] = filtered;
      hasChanges = true;
    }
  });

  return hasChanges ? nextBuckets : buckets;
}

export function removeCommentFromAllBuckets(buckets, commentId) {
  return removeCommentsFromAllBuckets(buckets, [commentId]);
}

export function removeBucket(buckets, bucketId) {
  if (!(bucketId in buckets)) return buckets;

  const nextBuckets = { ...buckets };
  delete nextBuckets[bucketId];
  return nextBuckets;
}