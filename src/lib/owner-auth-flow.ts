/**
 * After email OTP verification, the Sanctum token is stored so the WelcomeOverlay
 * flow can call the API via finalizeAuth; survives one refresh until finalizeAuth clears it.
 */
export const KH_OWNER_POST_OTP_TOKEN_KEY = 'kh_owner_post_otp_token';
