export type RedditLoginCompletionState = {
  hasSessionCookie: boolean;
  /**
   * Accepted to make tests explicit that Reddit URL transitions are ignored
   * until the session cookie exists.
   */
  url?: string;
};

/**
 * A Reddit WebView URL transition is not proof that the account is authenticated.
 * Reddit can navigate through cookie consent, signup, policy, challenge, and
 * destination pages before setting the session cookie. Only the reddit_session
 * cookie should trigger Hydra's native login probe.
 */
export function shouldFinishRedditLogin({
  hasSessionCookie,
}: RedditLoginCompletionState): boolean {
  return hasSessionCookie;
}
