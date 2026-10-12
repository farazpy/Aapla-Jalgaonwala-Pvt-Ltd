import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Analytics } from '@/services/analyticsTracker';
import { setReferralCookie } from '@/utils/referralCookie';

export const AnalyticsTrackerProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Automated background heartbeat (every 60s to minimize VPS server load)
    Analytics.startHeartbeat(60000);
  }, []);

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    Analytics.page(fullPath, document.title);

    // Check for partner referral code in query params
    const searchParams = new URLSearchParams(location.search);
    const refCode = searchParams.get('ref') || searchParams.get('partner');
    if (refCode) {
      const cleanRef = refCode.trim().toUpperCase();
      Analytics.trackPartnerReferralVisit(cleanRef);
      setReferralCookie(cleanRef);
    }
  }, [location.pathname, location.search]);

  return <>{children}</>;
};
