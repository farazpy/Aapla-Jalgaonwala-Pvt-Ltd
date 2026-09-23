import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Analytics } from '@/services/analyticsTracker';

export const AnalyticsTrackerProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Start automated background heartbeat (every 15s to reduce server load)
    Analytics.startHeartbeat(15000);
  }, []);

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    Analytics.page(fullPath, document.title);

    // Check for partner referral code in query params
    const searchParams = new URLSearchParams(location.search);
    const refCode = searchParams.get('ref') || searchParams.get('partner');
    if (refCode) {
      Analytics.trackPartnerReferralVisit(refCode);
    }
  }, [location.pathname, location.search]);

  return <>{children}</>;
};
