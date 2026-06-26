// Stars
(function generateStars() {
    const container = document.getElementById('stars');
    if (!container) return;
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--d', (2 + Math.random() * 4) + 's');
        const size = 1 + Math.random() * 2;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        container.appendChild(star);
    }
})();

// Shooting stars
(function shootingStars() {
    const container = document.getElementById('shootingStars');
    if (!container) return;
    function spawn() {
        const el = document.createElement('div');
        el.className = 'shooting-star';
        el.style.top = (5 + Math.random() * 20) + '%';
        el.style.right = '0';
        el.style.setProperty('--dur', (1.2 + Math.random() * 1.2) + 's');
        el.style.width = (50 + Math.random() * 80) + 'px';
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
    setInterval(spawn, 2000 + Math.random() * 4000);
    // Spawn one immediately
    setTimeout(spawn, 500);
})();

// FAQ toggle — global so inline onclick works
window.toggleFaq = function(btn) {
    const item = btn.parentElement;
    const wasActive = item.classList.contains('active');

    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));

    if (!wasActive) item.classList.add('active');
};

// Smooth scroll for anchor links
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

    // Hero entrance — stagger children
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        const children = heroContent.children;
        for (let i = 0; i < children.length; i++) {
            children[i].classList.add('hero-fade-in');
        }
    }

    // Navbar shrink on scroll
    const nav = document.querySelector('nav');
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        if (scrollY > 80) {
            nav.classList.add('nav-scrolled');
        } else {
            nav.classList.remove('nav-scrolled');
        }
        lastScroll = scrollY;
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
                            const duration = 1200;
                            const start = performance.now();
                            function update(now) {
                                const elapsed = now - start;
                                const progress = Math.min(elapsed / duration, 1);
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

    // Section entrance reveals
    const revealEls = document.querySelectorAll('.feature-row, #features, #faq, #purchase');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    revealEls.forEach(el => {
        el.classList.add('section-enter');
        revealObserver.observe(el);
    });

    // Feature card mouse tracking glow
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            this.style.setProperty('--mx', x + '%');
            this.style.setProperty('--my', y + '%');
        });
    });

    // Feature card fade-in (staggered)
    if (cards.length) {
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(24px)';
            card.style.transition = `opacity 0.7s ease ${i * 0.07}s, transform 0.7s ease ${i * 0.07}s`;
            cardObserver.observe(card);
        });
    }

    // Purchase card border glow pulse
    const purchaseCard = document.querySelector('#purchase .bg-white\\/\\[0\\.02\\]');
    if (purchaseCard) {
        setInterval(() => {
            purchaseCard.style.transition = 'border-color 2s ease';
            purchaseCard.style.borderColor = 'rgba(145, 200, 245, 0.15)';
            setTimeout(() => {
                purchaseCard.style.borderColor = 'rgba(145, 200, 245, 0.04)';
            }, 2000);
        }, 4000);
    }
});
