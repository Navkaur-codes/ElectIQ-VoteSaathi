// Timeline Interactive Logic

function initTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    timelineItems.forEach((item, index) => {
        observer.observe(item);
    });

    // Listen for view changes to re-trigger timeline animation
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#timeline') {
            timelineItems.forEach((item, index) => {
                item.classList.remove('visible');
                setTimeout(() => {
                    item.classList.add('visible');
                }, 100 * index);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', initTimeline);
