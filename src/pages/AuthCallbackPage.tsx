import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        const msg = searchParams.get('error_description') || 'Google sign in was cancelled or failed.';
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', message: msg }, '*');
          window.close();
        } else {
          setStatus('error');
          setErrorMessage(msg);
        }
        return;
      }

      if (!code) {
        const msg = 'No authorization code received from Google.';
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', message: msg }, '*');
          window.close();
        } else {
          setStatus('error');
          setErrorMessage(msg);
        }
        return;
      }

      try {
        const currentRedirectUri = `${window.location.origin}/auth/callback`;
        const res = await fetch('/api/auth/google/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirectUri: currentRedirectUri
          })
        });

        const json = await res.json();

        if (json.success && json.data?.user && json.data?.token) {
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_OAUTH_SUCCESS',
              user: json.data.user,
              token: json.data.token
            }, '*');
            window.close();
            return;
          }

          // Full-page flow: log in via context
          const result = await loginWithGoogle({
            email: json.data.user.email,
            name: json.data.user.name,
            picture: json.data.user.avatarUrl,
            googleId: json.data.user.googleId
          });

          if (result.success) {
            setStatus('success');
            setTimeout(() => {
              navigate('/account');
            }, 1000);
          } else {
            setStatus('error');
            setErrorMessage(result.message || 'Failed to initialize session.');
          }
        } else {
          const msg = json.error?.message || json.message || 'Google token exchange failed.';
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', message: msg }, '*');
            window.close();
          } else {
            setStatus('error');
            setErrorMessage(msg);
          }
        }
      } catch (err: any) {
        console.error('[Auth Callback] Error:', err);
        const msg = err.message || 'Network error during Google authentication.';
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', message: msg }, '*');
          window.close();
        } else {
          setStatus('error');
          setErrorMessage(msg);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithGoogle]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-stone-50">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>

        {status === 'loading' && (
          <div className="space-y-3">
            <h2 className="text-xl font-black text-stone-900">Connecting to Google...</h2>
            <p className="text-xs text-stone-600">Verifying your account credentials with Aapla Jalgaonwala.</p>
            <div className="w-8 h-8 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto pt-2" />
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h2 className="text-xl font-black text-stone-900">Welcome Back!</h2>
            <p className="text-xs text-emerald-700 font-bold">Authenticated successfully. Redirecting you to your account...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-black text-stone-900">Authentication Issue</h2>
            <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-200">
              {errorMessage}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-2xl bg-[#9B111E] text-white font-bold text-xs hover:bg-[#800A14] transition-all cursor-pointer shadow-md"
            >
              Return to Storefront
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
