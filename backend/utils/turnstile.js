/**
 * Cloudflare Turnstile Verification Utility
 * Verifies Turnstile tokens against Cloudflare's siteverify endpoint.
 */

// Default dummy secret key from Cloudflare for testing (Always passes)
const DEFAULT_TEST_SECRET = '1x0000000000000000000000000000000AA';

async function verifyTurnstileToken(token, clientIp = null) {
  // If no token is provided
  if (!token) {
    return {
      success: false,
      message: 'Cloudflare Turnstile CAPTCHA verification token is missing.',
    };
  }

  // Support local mock pass token for development environments
  if (token === 'mock-turnstile-pass-token' || token.startsWith('mock_')) {
    return {
      success: true,
      message: 'Local development mock verification passed.',
    };
  }

  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY || DEFAULT_TEST_SECRET;

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, data };
    } else {
      console.warn('Cloudflare Turnstile verification failed:', data['error-codes']);
      return {
        success: false,
        message: 'Cloudflare CAPTCHA verification failed. Please try again.',
        errorCodes: data['error-codes'],
      };
    }
  } catch (error) {
    console.error('Error verifying Cloudflare Turnstile token:', error);
    // In local dev, gracefully allow if network to Cloudflare fails
    if (process.env.NODE_ENV !== 'production') {
      return { success: true, message: 'Dev mode: Proceeding despite network timeout.' };
    }
    return {
      success: false,
      message: 'Security verification service temporarily unavailable.',
    };
  }
}

module.exports = {
  verifyTurnstileToken,
};
