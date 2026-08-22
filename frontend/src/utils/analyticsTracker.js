/**
 * Privacy-Preserving Client Analytics Tracker for BlogHub
 * Uses non-blocking background fetch & navigator.sendBeacon
 */

import { API_BASE_URL } from '../config';

const SESSION_KEY = 'bh_analytics_session_id';

export function getAnonymousSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch (e) {
    return 'sess_' + Date.now().toString(36);
  }
}

/**
 * Send an analytics event asynchronously without blocking UI or navigation
 */
export function logAnalyticsEvent({
  path = window.location.pathname,
  blogId = null,
  category = 'General',
  eventType = 'page_view',
  readingTime = 0,
}) {
  try {
    const payload = {
      session_id: getAnonymousSessionId(),
      path,
      blog_id: blogId,
      category,
      referrer: document.referrer || 'Direct',
      event_type: eventType,
      reading_time: readingTime,
    };

    const endpoint = `${API_BASE_URL}/api/analytics/event`;
    const bodyString = JSON.stringify(payload);

    // Try Beacon API first (works seamlessly even during page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([bodyString], { type: 'application/json' });
      const queued = navigator.sendBeacon(endpoint, blob);
      if (queued) return;
    }

    // Fallback to fetch with keepalive
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyString,
      keepalive: true,
    }).catch(() => {});
  } catch (err) {
    // Fail silently - analytics must never disturb user experience
  }
}

/**
 * Hook or helper for tracking article reading duration
 */
export function createReadingTimeTracker(blogId, category, path) {
  let startTime = Date.now();
  let accumulatedSeconds = 0;
  let isTracking = true;

  const intervalId = setInterval(() => {
    if (isTracking && document.visibilityState === 'visible') {
      accumulatedSeconds += 10;
    }
  }, 10000);

  const flush = () => {
    if (accumulatedSeconds > 0) {
      logAnalyticsEvent({
        path: path || window.location.pathname,
        blogId,
        category,
        eventType: 'article_view',
        readingTime: accumulatedSeconds,
      });
    }
  };

  const stop = () => {
    isTracking = false;
    clearInterval(intervalId);
    flush();
  };

  return { stop, flush };
}
