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

// FAQ toggle — global so inline onclick works
window.toggleFaq = function(btn) {
    const item = btn.parentElement;
    const wasActive = item.classList.contains('active');

    // Close all
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));

    // Toggle current
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

// Intersection Observer for fade-in feature cards
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.feature-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`;
        observer.observe(card);
    });
});
