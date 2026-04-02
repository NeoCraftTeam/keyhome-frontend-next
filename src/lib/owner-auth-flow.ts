/**
 * After email OTP verification, the Sanctum token is stored so complete-profile
 * can call the API; survives one refresh until finalizeAuth clears it.
 */
export const KH_OWNER_POST_OTP_TOKEN_KEY = 'kh_owner_post_otp_token';
