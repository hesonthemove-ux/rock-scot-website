// ROCK.SCOT - Main JavaScript

(function() {
    'use strict';

    // ── HEADER SCROLL EFFECT ──
    var header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function() {
            header.classList.toggle('scrolled', window.scrollY > 60);
        }, { passive: true });
    }

    // ── SMOOTH SCROLL ──
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ── SCROLL ANIMATIONS ──
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('section:not(#hero)').forEach(function(section) {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(section);
        });
    }

    // ── LISTEN LIVE BUTTONS ──
    document.querySelectorAll('[data-action="listen"], .btn-listen-live').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.rockScotPlayer) {
                window.rockScotPlayer.show();
            }
        });
    });

    // ── KEYBOARD SHORTCUTS ──
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal, #exit-intent').forEach(function(m) {
                m.style.display = 'none';
            });
        }
    });

    // ── CONSOLE BRANDING ──
    console.log('%c\uD83C\uDFB8 ROCK.SCOT \uD83C\uDFB8', 'font-size: 24px; font-weight: bold; color: #FF6600;');
    console.log('%cScotland\'s Rock Station on DAB+', 'font-size: 14px; color: #FFD700;');
    console.log('%c410,000+ Reach | Ofcom Licensed: SC646223', 'font-size: 11px; color: #999;');

})();
