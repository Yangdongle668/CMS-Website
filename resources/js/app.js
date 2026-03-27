import './bootstrap';
import AOS from 'aos';
import 'aos/dist/aos.css';
import gsap from 'gsap';
import { Swiper } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 600,
    easing: 'ease-in-out',
    once: true,
    offset: 100,
});

// Refresh AOS when new content is added
document.addEventListener('DOMContentLoaded', () => {
    AOS.refresh();
});

// Custom animation: Counter animation for numbers
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const interval = setInterval(() => {
        start += increment;
        if (start >= target) {
            start = target;
            clearInterval(interval);
        }
        element.textContent = Math.floor(start);
    }, 16);
}

// Custom animation: Scroll trigger animations
function initScrollAnimations() {
    const elements = document.querySelectorAll('[data-scroll-animate]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const animation = target.dataset.scrollAnimate;
                target.classList.add(`animate-${animation}`);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
});

// Export for use in components
window.gsap = gsap;
window.Swiper = Swiper;
window.animateCounter = animateCounter;
