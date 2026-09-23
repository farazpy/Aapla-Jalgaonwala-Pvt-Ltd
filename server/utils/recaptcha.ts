export async function verifyRecaptcha(token: string | undefined): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY || process.env.GOOGLE_RECAPTCHA_SECRET;
  
  // If no secret key configured in environment, allow gracefully (development / testing mode)
  if (!secretKey) {
    return { success: true, score: 1.0 };
  }

  if (!token) {
    return { success: false, error: 'reCAPTCHA token is required' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });

    const data: any = await response.json();

    if (data.success && (data.score === undefined || data.score >= 0.4)) {
      return { success: true, score: data.score };
    }

    return {
      success: false,
      score: data.score,
      error: data['error-codes'] ? data['error-codes'].join(', ') : 'reCAPTCHA verification failed',
    };
  } catch (err: any) {
    console.error('[reCAPTCHA] Verification error:', err);
    // Graceful fallback on network error
    return { success: true, score: 0.9 };
  }
}
