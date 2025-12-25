// Carrusel Automático del Hero Banner
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.hero-slide');
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    // Cambiar slide cada 5 segundos
    if (slides.length > 0) {
        setInterval(nextSlide, 5000);
    }
});

// Calendario JavaScript removido - reemplazado por perfil del barbero

// Menu Toggle para móvil
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Cerrar menú al hacer click en un enlace
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Cerrar menú al hacer click fuera
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('active')) {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
});

// Header que se oculta al hacer scroll hacia arriba y se muestra al hacer scroll hacia abajo
let lastScrollTop = 0;
let scrollThreshold = 100; // Umbral mínimo de scroll para activar el comportamiento

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    let ticking = false;

    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Solo activar si se ha hecho scroll más allá del umbral
        if (scrollTop > scrollThreshold) {
            if (scrollTop > lastScrollTop) {
                // Scrolling hacia abajo - mostrar header (quitar hidden)
                header.classList.remove('hidden');
            } else {
                // Scrolling hacia arriba - ocultar header
                header.classList.add('hidden');
            }
        } else {
            // Si estamos cerca del top, siempre mostrar el header
            header.classList.remove('hidden');
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Para dispositivos móviles
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });
});

// Scroll suave para enlaces de navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Filtro de servicios Caballeros/Damas
document.addEventListener('DOMContentLoaded', function() {
    const filtroButtons = document.querySelectorAll('.filtro-btn');
    const serviciosCaballeros = document.getElementById('servicios-caballeros');
    const serviciosDamas = document.getElementById('servicios-damas');
    
    filtroButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filtro = this.getAttribute('data-filtro');
            
            // Remover clase active de todos los botones
            filtroButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Mostrar/ocultar servicios según el filtro
            if (filtro === 'caballeros') {
                serviciosCaballeros.style.display = 'grid';
                serviciosDamas.style.display = 'none';
            } else if (filtro === 'damas') {
                serviciosCaballeros.style.display = 'none';
                serviciosDamas.style.display = 'grid';
            }
        });
    });
});

