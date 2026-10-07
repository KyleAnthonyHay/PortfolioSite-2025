/** Where a live call is, as the card shows it. */
export type CallPhase = 'connecting' | 'listening' | 'speaking' | 'working' | 'reconnecting' | 'ending';

/** The time cards shown at five minutes and one minute left. */
export type CallWarning = 'five' | 'one';

/** Why a call ended, for the "Call ended" entry in the chat. */
export type CallEndReason = 'hung_up' | 'limit' | 'error' | 'mic_denied' | 'busy' | 'unavailable' | 'dropped';
