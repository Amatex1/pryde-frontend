import { createContext, useContext } from 'react';

const CommentContext = createContext(null);

export function useCommentContext() {
  return useContext(CommentContext);
}

export function CommentProvider({ children, value }) {
  return <CommentContext.Provider value={value}>{children}</CommentContext.Provider>;
}
