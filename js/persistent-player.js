// ROCK.SCOT - Persistent Player with AJAX Navigation
// Keeps player playing while navigating

(function() {
    'use strict';
    
    let player = null;
    let isPlaying = false;
    
    // Create persistent player bar
    function createPlayerBar() {
        // Check if already exists
        if (document.getElementById('persistent-player')) return;
        
        const playerBar = document.createElement('div');
        playerBar.id = 'persistent-player';
        playerBar.innerHTML = `
            <div class="player-container">
                <div class="player-controls">
                    <button id="player-toggle" class="play-btn">
                        <span class="play-icon">▶</span>
                    </button>
                    <div class="player-info">
                        <div class="now-playing-label">NOW PLAYING</div>
                        <div class="track-title" id="track-title">ROCK.SCOT</div>
                        <div class="track-artist" id="track-artist">Scotland's Rock Station</div>
                    </div>
                </div>
                <div class="player-frame" id="player-frame-container"></div>
                <button class="player-close" id="player-close">✕</button>
            </div>
        `;
        
        document.body.appendChild(playerBar);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #persistent-player {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.98);
                backdrop-filter: blur(25px);
                border-top: 3px solid #FF6600;
                padding: 1rem 2rem;
                z-index: 9999;
                transform: translateY(100%);
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
            }
            
            #persistent-player.active {
                transform: translateY(0);
            }
            
            .player-container {
                max-width: 1600px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: auto 1fr auto;
                gap: 2rem;
                align-items: center;
            }
            
            .player-controls {
                display: flex;
                gap: 1.5rem;
                align-items: center;
            }
            
            .play-btn {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #FF6600, #FF8833);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                color: white;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(255, 102, 0, 0.4);
            }
            
            .play-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(255, 102, 0, 0.6);
            }
            
            .play-btn.playing .play-icon::before {
                content: '⏸';
            }
            
            .player-info {
                min-width: 200px;
            }
            
            .now-playing-label {
                font-size: 0.7rem;
                letter-spacing: 0.15em;
                color: #FF6600;
                text-transform: uppercase;
                font-weight: 700;
                margin-bottom: 0.25rem;
            }
            
            .track-title {
                font-weight: 700;
                font-size: 1.1rem;
                color: white;
                margin-bottom: 0.25rem;
            }
            
            .track-artist {
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.9rem;
            }
            
            .player-frame {
                display: flex;
                justify-content: center;
            }
            
            .player-frame iframe {
                width: 100%;
                max-width: 600px;
                height: 80px;
                border: none;
                border-radius: 10px;
            }
            
            .player-close {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                transition: color 0.3s;
            }
            
            .player-close:hover {
                color: #FF6600;
            }
            
            @media (max-width: 768px) {
                .player-container {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                
                .player-controls {
                    justify-content: center;
                }
                
                .player-info {
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Set up event listeners
        document.getElementById('player-toggle').addEventListener('click', togglePlayer);
        document.getElementById('player-close').addEventListener('click', closePlayer);
    }
    
    // Initialize player
    function initPlayer() {
        if (player) return; // Already initialized
        
        const container = document.getElementById('player-frame-container');
        if (!container) return;
        
        // Create iframe
        player = document.createElement('iframe');
        player.src = 'https://player.broadcast.radio/caledonia-tx-ltd';
        player.allow = 'autoplay';
        player.style.width = '100%';
        player.style.maxWidth = '600px';
        player.style.height = '80px';
        player.style.border = 'none';
        player.style.borderRadius = '10px';
        
        container.appendChild(player);
        isPlaying = true;
        
        document.getElementById('player-toggle').classList.add('playing');
        document.getElementById('track-title').textContent = 'ROCK.SCOT LIVE';
        document.getElementById('track-artist').textContent = 'Broadcasting Now';
    }
    
    // Toggle player
    function togglePlayer() {
        const playerBar = document.getElementById('persistent-player');
        
        if (!playerBar.classList.contains('active')) {
            playerBar.classList.add('active');
            if (!player) {
                initPlayer();
            }
        } else {
            // Just toggle play/pause visual
            const btn = document.getElementById('player-toggle');
            btn.classList.toggle('playing');
            
            if (btn.classList.contains('playing')) {
                document.getElementById('track-title').textContent = 'ROCK.SCOT LIVE';
                document.getElementById('track-artist').textContent = 'Broadcasting Now';
            } else {
                document.getElementById('track-title').textContent = 'Paused';
                document.getElementById('track-artist').textContent = 'Click to resume';
            }
        }
    }
    
    // Close player
    function closePlayer() {
        const playerBar = document.getElementById('persistent-player');
        playerBar.classList.remove('active');
    }
    
    // Show player bar
    function showPlayer() {
        const playerBar = document.getElementById('persistent-player');
        if (!playerBar) {
            createPlayerBar();
        }
        setTimeout(() => {
            playerBar.classList.add('active');
            if (!player) {
                initPlayer();
            }
        }, 100);
    }
    
    // AJAX Navigation System
    function setupAJAXNavigation() {
        // Intercept all internal links
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            
            if (!link) return;
            
            const href = link.getAttribute('href');
            
            // Skip external links, anchors, and special links
            if (!href || 
                href.startsWith('http') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:') ||
                href.startsWith('#') ||
                link.target === '_blank') {
                return;
            }
            
            // Skip if link has data-no-ajax attribute
            if (link.hasAttribute('data-no-ajax')) {
                return;
            }
            
            e.preventDefault();
            loadPage(href);
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.url) {
                loadPage(e.state.url, false);
            }
        });
    }
    
    // Load page via AJAX
    async function loadPage(url, pushState = true) {
        try {
            // Show loading indicator
            document.body.style.opacity = '0.7';
            
            const response = await fetch(url);
            const html = await response.text();
            
            // Parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract main content (everything except player bar)
            const newContent = doc.querySelector('body').innerHTML;
            
            // Find main element or use body
            const main = document.querySelector('main') || document.querySelector('body');
            
            // Replace content but preserve player bar
            const playerBar = document.getElementById('persistent-player');
            main.innerHTML = doc.querySelector('main')?.innerHTML || newContent;
            
            // Re-append player bar if it exists
            if (playerBar && !document.getElementById('persistent-player')) {
                document.body.appendChild(playerBar);
            }
            
            // Update page title
            document.title = doc.title;
            
            // Update URL
            if (pushState) {
                window.history.pushState({ url: url }, '', url);
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Restore opacity
            document.body.style.opacity = '1';
            
            // Re-run any page-specific scripts
            setupListenButtons();
            
        } catch (error) {
            console.error('Page load error:', error);
            // Fallback to normal navigation
            window.location.href = url;
        }
    }
    
    // Setup listen buttons
    function setupListenButtons() {
        const listenButtons = document.querySelectorAll('.btn-listen, .btn-listen-live, [data-action="listen"]');
        
        listenButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                showPlayer();
            });
        });
    }
    
    // Initialize everything
    function init() {
        createPlayerBar();
        setupAJAXNavigation();
        setupListenButtons();
        
        console.log('🎸 Persistent player initialized!');
        console.log('   → Player will keep playing when navigating');
        console.log('   → Click any "Listen Live" button to start');
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Make showPlayer available globally
    window.rockScotPlayer = {
        show: showPlayer,
        close: closePlayer,
        toggle: togglePlayer
    };
    
})();
