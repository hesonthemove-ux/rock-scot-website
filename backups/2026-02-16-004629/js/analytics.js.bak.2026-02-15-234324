// ROCK.SCOT Analytics Tracking
// Tracks page views, sessions, and linger time

(function() {
    'use strict';
    
    const SUPABASE_URL = window.SUPABASE_URL || 'https://pwzeapvopeeoahpyicdm.supabase.co';
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3emVhcHZvcGVlb2FocHlpY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjg3NDEsImV4cCI6MjA4Njc0NDc0MX0.rc8IqfQF537UA5iWarxDia174HyCZ_xc2VPWOWdGxYk';
    
    // Generate or retrieve session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('rock_session_id');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem('rock_session_id', sessionId);
        }
        return sessionId;
    }
    
    // Get or create persistent visitor ID
    function getVisitorId() {
        let visitorId = localStorage.getItem('rock_visitor_id');
        if (!visitorId) {
            visitorId = crypto.randomUUID();
            localStorage.setItem('rock_visitor_id', visitorId);
        }
        return visitorId;
    }
    
    // Detect device type
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }
    
    // Track page view
    async function trackPageView() {
        // Check if analytics allowed
        if (!window.analyticsAllowed) {
            console.log('📊 Analytics disabled - no tracking');
            return;
        }
        
        const sessionId = getSessionId();
        const visitorId = getVisitorId();
        
        const pageView = {
            session_id: sessionId,
            user_id: visitorId,
            page_path: window.location.pathname,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            device_type: getDeviceType(),
            created_at: new Date().toISOString()
        };
        
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/page_views`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(pageView)
            });
            
            // Update session
            updateSession(sessionId, visitorId);
            
        } catch (err) {
            console.error('Analytics error:', err);
        }
    }
    
    // Update session activity
    async function updateSession(sessionId, visitorId) {
        const sessionData = {
            id: sessionId,
            user_id: visitorId,
            last_activity_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer || null
        };
        
        // Try to insert, if exists it will fail silently
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(sessionData)
            });
        } catch (err) {
            // Session already exists, update it
            await fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    last_activity_at: new Date().toISOString()
                })
            });
        }
    }
    
    // Track time on page
    let pageStartTime = Date.now();
    let sessionStartTime = parseInt(sessionStorage.getItem('rock_session_start') || Date.now());
    sessionStorage.setItem('rock_session_start', sessionStartTime);
    
    // Update session duration periodically
    setInterval(() => {
        const sessionId = getSessionId();
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        
        // Update session duration
        fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                duration_seconds: duration,
                last_activity_at: new Date().toISOString()
            })
        }).catch(err => console.error('Session update error:', err));
        
    }, 10000); // Update every 10 seconds
    
    // Track page views on visibility change (tab switching)
    let pageViewCount = parseInt(sessionStorage.getItem('rock_page_count') || '0');
    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            updateSession(getSessionId(), getVisitorId());
        }
    });
    
    // Track when user leaves (send final session data)
    window.addEventListener('beforeunload', () => {
        const sessionId = getSessionId();
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        
        // Use sendBeacon for reliable sending on page unload
        const data = JSON.stringify({
            duration_seconds: duration,
            ended_at: new Date().toISOString()
        });
        
        navigator.sendBeacon(
            `${SUPABASE_URL}/rest/v1/sessions?id=eq.${sessionId}`,
            new Blob([data], { type: 'application/json' })
        );
    });
    
    // Initialize tracking
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
        trackPageView();
    }
    
    // Track page view count
    pageViewCount++;
    sessionStorage.setItem('rock_page_count', pageViewCount);
    
    // Update session page count
    setTimeout(() => {
        const sessionId = getSessionId();
        fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                pages_viewed: pageViewCount
            })
        });
    }, 1000);
    
    console.log('📊 Analytics tracking initialized');
    
})();
