// Falling stars
(function fallingStars() {
    const container = document.getElementById('stars');
    if (!container) return;
    const COUNT = 120;
    for (let i = 0; i < COUNT; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = 1 + Math.random() * 2;
        const duration = 8 + Math.random() * 20;
        const delay = Math.random() * duration * -1;
        const drift = (Math.random() - 0.5) * 120;
        const maxOp = 0.2 + Math.random() * 0.5;
        star.style.left = x + '%';
        star.style.top = y + '%';
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.setProperty('--drift', drift);
        star.style.setProperty('--max-opacity', maxOp);
        star.style.animationDuration = duration + 's';
        star.style.animationDelay = delay + 's';
        container.appendChild(star);
    }
})();

// FAQ toggle
window.toggleFaq = function(btn) {
    const item = btn.parentElement;
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
    if (!wasActive) item.classList.add('active');
};

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// DOM ready
document.addEventListener('DOMContentLoaded', function() {

    // Hero entrance
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        for (let i = 0; i < heroContent.children.length; i++) {
            heroContent.children[i].classList.add('hero-fade-in');
        }
    }

    // Navbar shrink
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', function() {
        nav.classList.toggle('nav-scrolled', window.scrollY > 80);
    });

    // Counter animation for stats
    const statsSection = document.querySelector('.hero .flex.gap-12');
    if (statsSection) {
        const statValues = statsSection.querySelectorAll('h3');
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statValues.forEach(el => {
                        const text = el.textContent;
                        const num = parseInt(text);
                        if (!isNaN(num)) {
                            el.textContent = '0';
                            const target = num;
                            const duration = 1000;
                            const start = performance.now();
                            function update(now) {
                                const progress = Math.min((now - start) / duration, 1);
                                const eased = 1 - Math.pow(1 - progress, 3);
                                el.textContent = Math.floor(eased * target) + '+';
                                if (progress < 1) requestAnimationFrame(update);
                            }
                            requestAnimationFrame(update);
                        }
                    });
                    counterObserver.disconnect();
                }
            });
        }, { threshold: 0.5 });
        counterObserver.observe(statsSection);
    }

    // Section reveals
    const revealEls = document.querySelectorAll('.feature-row, #features, #faq, #purchase');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    revealEls.forEach(el => {
        el.classList.add('section-enter');
        revealObserver.observe(el);
    });

    // Feature card fade-in
    const cards = document.querySelectorAll('.feature-card');
    if (cards.length) {
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `opacity 0.6s ease ${i * 0.06}s, transform 0.6s ease ${i * 0.06}s`;
            cardObserver.observe(card);
        });
    }
});
