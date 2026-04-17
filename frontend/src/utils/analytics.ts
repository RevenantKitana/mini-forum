type AnalyticsEvent = {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  page: string;
};

const SESSION_KEY = 'forum_analytics_session';
const EVENTS_KEY = 'forum_analytics_events';
const BATCH_SIZE = 20;

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function getStoredEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function storeEvents(events: AnalyticsEvent[]) {
  // Keep only last 200 events to prevent unbounded growth
  const trimmed = events.slice(-200);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
}

/**
 * Track an analytics event (stored locally, can be sent to backend later)
 */
export function trackEvent(event: string, properties?: Record<string, any>) {
  const entry: AnalyticsEvent = {
    event,
    properties,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    page: window.location.pathname,
  };

  const events = getStoredEvents();
  events.push(entry);
  storeEvents(events);
}

/**
 * Track a page view
 */
export function trackPageView(pageName?: string) {
  trackEvent('page_view', {
    pageName: pageName || document.title,
    referrer: document.referrer,
  });
}

/**
 * Track a search query
 */
export function trackSearch(query: string, resultCount: number) {
  trackEvent('search', { query, resultCount });
}

/**
 * Track post interaction
 */
export function trackPostInteraction(action: string, postId: number, extra?: Record<string, any>) {
  trackEvent('post_interaction', { action, postId, ...extra });
}

/**
 * Track user engagement
 */
export function trackEngagement(action: string, extra?: Record<string, any>) {
  trackEvent('engagement', { action, ...extra });
}

/**
 * Get all stored analytics events (for dashboard / export)
 */
export function getAnalyticsEvents(): AnalyticsEvent[] {
  return getStoredEvents();
}

/**
 * Get basic session analytics summary
 */
export function getSessionSummary() {
  const events = getStoredEvents();
  const sessionId = getSessionId();
  const sessionEvents = events.filter(e => e.sessionId === sessionId);

  return {
    sessionId,
    totalEvents: sessionEvents.length,
    pageViews: sessionEvents.filter(e => e.event === 'page_view').length,
    searches: sessionEvents.filter(e => e.event === 'search').length,
    postInteractions: sessionEvents.filter(e => e.event === 'post_interaction').length,
    sessionStart: sessionEvents[0]?.timestamp,
    lastActivity: sessionEvents[sessionEvents.length - 1]?.timestamp,
  };
}

/**
 * Clear old events (keep only last 7 days)
 */
export function cleanupOldEvents() {
  const events = getStoredEvents();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = events.filter(e => e.timestamp > sevenDaysAgo);
  storeEvents(recent);
}

// ===== Conversion & Retention Measurement =====

const RETENTION_KEY = 'forum_retention';
const SESSION_START_KEY = 'forum_session_start';

interface RetentionData {
  firstVisit: number;
  lastVisit: number;
  visitDays: string[]; // ISO date strings of unique visit days
  totalSessions: number;
  registeredAt?: number;
  lastLoginAt?: number;
}

function getRetentionData(): RetentionData {
  try {
    const stored = localStorage.getItem(RETENTION_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    firstVisit: Date.now(),
    lastVisit: Date.now(),
    visitDays: [new Date().toISOString().slice(0, 10)],
    totalSessions: 0,
  };
}

function saveRetentionData(data: RetentionData) {
  localStorage.setItem(RETENTION_KEY, JSON.stringify(data));
}

/**
 * Track a new session visit for retention measurement.
 * Call once per session (e.g. in usePageTracking).
 */
export function trackSessionStart() {
  if (sessionStorage.getItem(SESSION_START_KEY)) return; // already tracked this session
  sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));

  const data = getRetentionData();
  const today = new Date().toISOString().slice(0, 10);
  data.lastVisit = Date.now();
  data.totalSessions += 1;
  if (!data.visitDays.includes(today)) {
    data.visitDays.push(today);
    // Keep only last 90 days
    if (data.visitDays.length > 90) {
      data.visitDays = data.visitDays.slice(-90);
    }
  }
  saveRetentionData(data);
}

/**
 * Track conversion event (registration or login).
 */
export function trackConversion(type: 'register' | 'login') {
  const data = getRetentionData();
  if (type === 'register') {
    data.registeredAt = Date.now();
    trackEvent('conversion', { type: 'register' });
  } else {
    data.lastLoginAt = Date.now();
    trackEvent('conversion', { type: 'login' });
  }
  saveRetentionData(data);
}

/**
 * Get current session duration in seconds.
 */
export function getSessionDuration(): number {
  const start = sessionStorage.getItem(SESSION_START_KEY);
  if (!start) return 0;
  return Math.floor((Date.now() - Number(start)) / 1000);
}

/**
 * Get retention metrics summary.
 */
export function getRetentionMetrics() {
  const data = getRetentionData();
  const now = Date.now();
  const daysSinceFirst = Math.floor((now - data.firstVisit) / (24 * 60 * 60 * 1000));
  const daysSinceLast = Math.floor((now - data.lastVisit) / (24 * 60 * 60 * 1000));

  // Calculate retention rates
  const last7 = data.visitDays.filter(d => {
    const diff = (now - new Date(d).getTime()) / (24 * 60 * 60 * 1000);
    return diff <= 7;
  }).length;
  const last30 = data.visitDays.filter(d => {
    const diff = (now - new Date(d).getTime()) / (24 * 60 * 60 * 1000);
    return diff <= 30;
  }).length;

  return {
    firstVisit: data.firstVisit,
    daysSinceFirstVisit: daysSinceFirst,
    daysSinceLastVisit: daysSinceLast,
    totalSessions: data.totalSessions,
    uniqueVisitDays: data.visitDays.length,
    activeDaysLast7: last7,
    activeDaysLast30: last30,
    isReturningUser: data.totalSessions > 1,
    isRegistered: !!data.registeredAt,
    sessionDuration: getSessionDuration(),
  };
}
