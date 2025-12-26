// Sistema de Reservas con Google Calendar - Backend Node.js
(function() {
    'use strict';

    // CONFIGURACIÓN: URL del backend
    const BACKEND_URL = 'http://localhost:3000'; // Cambiar según el entorno
    
    // Email del barbero
    const BARBER_EMAIL = 'juanjog0628@gmail.com';
    
    // Zona horaria
    const TIMEZONE = 'America/Bogota';

    const utils = {
        getElement: (selector) => document.querySelector(selector),
        getElements: (selector) => document.querySelectorAll(selector)
    };

    let availableSlots = [];
    let selectedService = null;
    let isInitialized = false;
    let isAuthenticated = false;

    // Verificar autenticación
    async function checkAuth() {
        try {
            const response = await fetch(`${BACKEND_URL}/auth/status`);
            const data = await response.json();
            isAuthenticated = data.authenticated;
            
            if (!isAuthenticated) {
                console.warn('⚠️ Backend no autenticado. Necesitas autorizar la aplicación.');
                // No mostrar alerta automáticamente, solo cuando el usuario intente reservar
            }
            return isAuthenticated;
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            return false;
        }
    }

    // Inicializar autenticación si es necesario
    async function initAuth() {
        const authenticated = await checkAuth();
        if (!authenticated) {
            try {
                const response = await fetch(`${BACKEND_URL}/auth`);
                const data = await response.json();
                console.log('🔗 URL de autorización:', data.authUrl);
                // No abrir automáticamente, solo cuando sea necesario
            } catch (error) {
                console.error('Error al obtener URL de autorización:', error);
            }
        }
    }

    // Inicializar sistema de reservas
    function initBooking() {
        if (isInitialized) {
            console.warn('initBooking ya fue llamado, omitiendo...');
            return;
        }
        
        try {
            if (typeof SERVICES_CONFIG === 'undefined') {
                console.error('SERVICES_CONFIG no está disponible.');
                return;
            }
            
            const bookingButtons = utils.getElements('.btn-reservar');
            const modal = utils.getElement('#bookingModal');
            const closeBtn = utils.getElement('.booking-modal-close');
            const cancelBtn = utils.getElement('#bookingCancel');
            const bookingForm = utils.getElement('#bookingForm');
            const dateInput = utils.getElement('#bookingDate');

            if (!modal) {
                console.error('Modal de reserva no encontrado en el DOM');
                return;
            }

            // Event listeners para botones de reserva
            bookingButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const serviceId = button.getAttribute('data-service');
                    if (serviceId && SERVICES_CONFIG[serviceId]) {
                        openBookingModal(serviceId);
                    }
                });
            });

            // Event listeners para cerrar modal
            if (closeBtn) {
                closeBtn.addEventListener('click', closeModal);
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', closeModal);
            }

            // Cerrar modal al hacer clic fuera
            const overlay = utils.getElement('.booking-modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', closeModal);
            }

            // Event listener para cambio de fecha
            if (dateInput) {
                dateInput.addEventListener('change', () => {
                    const selectedDate = dateInput.value;
                    if (selectedDate) {
                        loadAvailableSlots(selectedDate);
                    }
                });
            }

            // Event listener para envío del formulario
            if (bookingForm) {
                bookingForm.addEventListener('submit', handleBookingSubmit);
            }

            // Inicializar autenticación
            initAuth();

            isInitialized = true;
            console.log('✅ Sistema de reservas inicializado');
        } catch (error) {
            console.error('Error al inicializar sistema de reservas:', error);
        }
    }

    // Abrir modal de reserva
    function openBookingModal(serviceId) {
        try {
            if (!SERVICES_CONFIG[serviceId]) {
                console.error('Servicio no encontrado:', serviceId);
                return;
            }

            selectedService = SERVICES_CONFIG[serviceId];
            const modal = utils.getElement('#bookingModal');
            const serviceDisplay = utils.getElement('#bookingServiceDisplay');
            const durationDisplay = utils.getElement('#bookingDurationDisplay');
            const serviceIdInput = utils.getElement('#bookingServiceId');
            const serviceNameInput = utils.getElement('#bookingServiceName');
            const durationInput = utils.getElement('#bookingDuration');

            if (!modal) return;

            // Llenar información del servicio
            if (serviceDisplay) serviceDisplay.textContent = selectedService.name;
            if (durationDisplay) durationDisplay.textContent = selectedService.duration;
            if (serviceIdInput) serviceIdInput.value = serviceId;
            if (serviceNameInput) serviceNameInput.value = selectedService.name;
            if (durationInput) durationInput.value = selectedService.duration;

            // Mostrar modal
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            // Establecer fecha mínima (hoy)
            const dateInput = utils.getElement('#bookingDate');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.setAttribute('min', today);
                dateInput.value = '';
            }

            // Limpiar slots anteriores
            availableSlots = [];
            const timeSelect = utils.getElement('#bookingTime');
            if (timeSelect) {
                timeSelect.innerHTML = '<option value="" data-i18n="booking.selectTime">Selecciona una hora</option>';
            }
        } catch (error) {
            console.error('Error al abrir modal:', error);
        }
    }

    // Cerrar modal
    function closeModal() {
        const modal = utils.getElement('#bookingModal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        selectedService = null;
        availableSlots = [];
    }

    // Cargar slots disponibles desde el backend
    async function loadAvailableSlots(date) {
        try {
            if (!selectedService) return;

            const timeSelect = utils.getElement('#bookingTime');
            if (!timeSelect) return;

            // Verificar autenticación primero
            const authenticated = await checkAuth();
            if (!authenticated) {
                timeSelect.innerHTML = '<option value="">⚠️ Necesitas autorizar la aplicación primero</option>';
                timeSelect.disabled = true;
                
                // Mostrar botón para autorizar
                const authButton = document.createElement('button');
                authButton.type = 'button';
                authButton.className = 'btn btn-primary';
                authButton.textContent = 'Autorizar Google Calendar';
                authButton.style.marginTop = '1rem';
                authButton.onclick = async () => {
                    try {
                        const response = await fetch(`${BACKEND_URL}/auth`);
                        const data = await response.json();
                        window.open(data.authUrl, '_blank');
                        alert('Se abrió una nueva ventana para autorizar. Después de autorizar, recarga esta página.');
                    } catch (error) {
                        alert('Error al obtener URL de autorización: ' + error.message);
                    }
                };
                
                // Insertar botón si no existe
                if (!timeSelect.parentElement.querySelector('.auth-button')) {
                    authButton.className += ' auth-button';
                    timeSelect.parentElement.appendChild(authButton);
                }
                return;
            }

            timeSelect.disabled = false;
            timeSelect.innerHTML = '<option value="">Cargando horarios disponibles...</option>';

            // Obtener disponibilidad del backend
            const response = await fetch(`${BACKEND_URL}/api/availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: date,
                    duration: selectedService.duration
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.needsReauth) {
                    timeSelect.innerHTML = '<option value="">⚠️ Sesión expirada. Por favor autoriza nuevamente.</option>';
                    timeSelect.disabled = true;
                    return;
                }
                throw new Error(errorData.error || 'Error al obtener disponibilidad');
            }

            const data = await response.json();
            availableSlots = data.availableSlots.map(slot => ({
                time: slot.display,
                start: new Date(slot.start),
                end: new Date(slot.end),
                display: slot.display
            }));

            // Llenar select con slots disponibles
            timeSelect.innerHTML = '<option value="" data-i18n="booking.selectTime">Selecciona una hora</option>';
            
            if (availableSlots.length === 0) {
                timeSelect.innerHTML += '<option value="">No hay horarios disponibles para esta fecha</option>';
            } else {
                availableSlots.forEach(slot => {
                    const option = document.createElement('option');
                    option.value = slot.display;
                    option.textContent = slot.display;
                    timeSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar slots disponibles:', error);
            const timeSelect = utils.getElement('#bookingTime');
            if (timeSelect) {
                timeSelect.innerHTML = '<option value="">Error al cargar horarios. Intenta de nuevo.</option>';
            }
        }
    }

    // Manejar envío del formulario
    async function handleBookingSubmit(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            const name = form.querySelector('#bookingName').value.trim();
            const email = form.querySelector('#bookingEmail').value.trim();
            const date = form.querySelector('#bookingDate').value;
            const time = form.querySelector('#bookingTime').value;

            // Validaciones
            if (!name || !email || !date || !time) {
                alert('Por favor completa todos los campos');
                return;
            }

            if (!selectedService) {
                alert('Error: Servicio no seleccionado');
                return;
            }

            // Verificar autenticación
            const authenticated = await checkAuth();
            if (!authenticated) {
                const auth = confirm('Necesitas autorizar la aplicación para continuar. ¿Deseas autorizar ahora?');
                if (auth) {
                    try {
                        const response = await fetch(`${BACKEND_URL}/auth`);
                        const data = await response.json();
                        window.open(data.authUrl, '_blank');
                        alert('Se abrió una nueva ventana para autorizar. Después de autorizar, intenta la reserva nuevamente.');
                    } catch (error) {
                        alert('Error al obtener URL de autorización: ' + error.message);
                    }
                }
                return;
            }

            // Encontrar el slot seleccionado
            const selectedSlot = availableSlots.find(slot => slot.time === time);
            if (!selectedSlot) {
                alert('Por favor selecciona un horario válido');
                return;
            }

            // Obtener botón de envío
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : 'Confirmar Reserva';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creando reserva...';
            }

            // Preparar datos
            const bookingData = {
                name: name,
                email: email,
                serviceName: selectedService.name,
                duration: selectedService.duration,
                date: date,
                time: time,
                formattedDate: formatDateDisplay(date),
                formattedTime: selectedSlot.display,
                startTime: selectedSlot.start.toISOString(),
                endTime: selectedSlot.end.toISOString(),
                location: 'Carrera 54 #55-53 local 1'
            };

            // Enviar al backend
            const response = await fetch(`${BACKEND_URL}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.needsReauth) {
                    alert('Tu sesión expiró. Por favor autoriza la aplicación nuevamente.');
                    return;
                }
                throw new Error(errorData.error || 'Error al crear la reserva');
            }

            const result = await response.json();
            
            if (result.success) {
                alert(`¡Reserva confirmada exitosamente! 🎉\n\nServicio: ${selectedService.name}\nFecha: ${formatDateDisplay(date)}\nHora: ${selectedSlot.display}\n\n✅ El evento ha sido creado en Google Calendar.\n✅ El barbero ha sido notificado.\n✅ Has recibido una invitación por email.`);
                closeModal();
                form.reset();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al procesar la reserva:', error);
            alert('Error al procesar la reserva: ' + error.message);
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }

    // Formatear fecha para mostrar
    function formatDateDisplay(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBooking);
    } else {
        initBooking();
    }
})();

