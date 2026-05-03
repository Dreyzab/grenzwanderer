export interface SenderLike {
  toHexString?: () => string;
}

export interface ReducerContextLike {
  sender: SenderLike | (() => SenderLike);
  timestamp?: unknown;
  db: Record<string, any>;
}

export const senderOf = (ctx: ReducerContextLike): SenderLike =>
  typeof ctx.sender === "function" ? ctx.sender() : ctx.sender;
