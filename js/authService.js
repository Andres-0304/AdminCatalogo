// Servicio de Autenticación
class AuthService {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.userEmail = localStorage.getItem('userEmail');
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return !!this.token;
    }

    // Obtener token
    getToken() {
        return this.token;
    }

    // Obtener email del usuario
    getUserEmail() {
        return this.userEmail;
    }

    // Verificar si el token sigue siendo válido
    async verifyToken() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch('/api/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error verificando token:', error);
            return false;
        }
    }

    // Hacer logout
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        this.token = null;
        this.userEmail = null;
        window.location.href = '/login.html';
    }

    // Redirigir al login si no está autenticado
    async requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }

        const isValid = await this.verifyToken();
        if (!isValid) {
            this.logout();
            return false;
        }

        return true;
    }

    // Agregar token a las peticiones
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Crear instancia global
window.authService = new AuthService();
