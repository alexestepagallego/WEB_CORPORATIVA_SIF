export class AuthController {
    constructor(app) {
        this.app = app;
    }

    async login() {
        const username = document.getElementById('username-input').value.trim();
        const password = document.getElementById('password-input').value.trim();

        if (!username || !password) {
            alert('Por favor, introduzca nombre de usuario y contraseña.');
            return;
        }

        await this.authenticate(username, password);
    }

    async authenticate(username, password) {
        try {
            let user = await this.app.db.getUserByUsername(username);
            let role = 'student'; // Default fallback role

            if (user) {
                // --- USER EXISTS: VALIDATE PASSWORD ---
                console.log(`Usuario encontrado: ${user.name}`);
                role = user.role || role; 
                this.app.currentRole = role;
                
                if (user.password && user.password !== password) {
                    alert('Contraseña incorrecta.');
                    return;
                }
                
                if (!user.password) {
                    // Start saving password for legacy mock data users
                    user.password = password;
                    await this.app.db.saveUser(user, role);
                }
            } else {
                // --- USER DOES NOT EXIST: REGISTER NEW USER ---
                console.log("Usuario no encontrado. Registrando nuevo desarrollador por defecto...");
                this.app.currentRole = 'student';

                user = {
                    id: `student_${Date.now()}`,
                    name: username.includes('@') ? username.split('@')[0] : username,
                    email: username,
                    password: password, 
                    role: 'student',
                    status: 'unassigned',
                    assignedTutorId: null
                };

                await this.app.db.saveUser(user, 'student');
                alert(`Nuevo desarrollador registrado exitosamente. (Si eres Líder Técnico/PM, contacta al administrador del sistema)`);
            }

            // --- PROCEED TO LOGIN ---
            if (!user) {
                alert('Error crítico: No se pudo obtener el usuario.');
                return;
            }

            // CRITICAL FIX: Set currentUser BEFORE navigating
            this.app.currentUser = user;

            // Navigate based on role
            if (role === 'admin') {
                document.getElementById('admin-nav').classList.remove('hidden');
                document.getElementById('tutor-nav').classList.add('hidden');
                document.getElementById('student-nav').classList.add('hidden');
                await this.app.navigate('admin-dashboard');
            } else if (role === 'tutor') {
                document.getElementById('admin-nav').classList.add('hidden');
                document.getElementById('tutor-nav').classList.remove('hidden');
                document.getElementById('student-nav').classList.add('hidden');
                await this.app.navigate('tutor-chat');
            } else if (role === 'student') {
                document.getElementById('admin-nav').classList.add('hidden');
                document.getElementById('tutor-nav').classList.add('hidden');
                document.getElementById('student-nav').classList.remove('hidden');
                await this.app.navigate('student-chat');
                // INIT ALERTS FOR STUDENT
                await this.app.studentController.initAlerts();
            }

            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            this.updateUserProfile();

            // Clear forms
            document.getElementById('username-input').value = '';
            document.getElementById('password-input').value = '';
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error durante el inicio de sesión: ' + error.message);
        }
    }

    logout() {
        this.app.currentUser = null;
        this.app.currentRole = null;
        document.getElementById('app').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');

        // Clear forms
        document.getElementById('username-input').value = '';
        document.getElementById('password-input').value = '';

        // Clear alerts
        const alertContainer = document.getElementById('alert-container');
        if (alertContainer) alertContainer.innerHTML = '';

        // Unsubscribe from listeners to prevent leaks
        if (this.app.studentController.alertsUnsubscribe) {
            this.app.studentController.alertsUnsubscribe();
            this.app.studentController.alertsUnsubscribe = null;
        }
        if (this.app.studentController.chatUnsubscribe) {
            this.app.studentController.chatUnsubscribe();
            this.app.studentController.chatUnsubscribe = null;
        }
        if (this.app.tutorController.chatUnsubscribe) {
            this.app.tutorController.chatUnsubscribe();
            this.app.tutorController.chatUnsubscribe = null;
        }
        if (this.app.tutorController.alertsUnsubscribe) {
            this.app.tutorController.alertsUnsubscribe();
            this.app.tutorController.alertsUnsubscribe = null;
        }
    }

    updateUserProfile() {
        if (!this.app.currentUser) return;

        document.getElementById('user-name').textContent = this.app.currentUser.name;
        let roleName = 'Usuario';
        if (this.app.currentRole === 'admin') roleName = 'Product Manager';
        if (this.app.currentRole === 'tutor') roleName = 'Líder Técnico';
        if (this.app.currentRole === 'student') roleName = 'Desarrollador';

        document.getElementById('user-role').textContent = roleName;
        
        const avatarEl = document.getElementById('user-avatar');
        if (this.app.currentUser.avatarBase64) {
            avatarEl.innerHTML = `<img src="${this.app.currentUser.avatarBase64}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            // remove text content if there's an image
            avatarEl.style.padding = '0';
        } else {
            avatarEl.innerHTML = this.app.currentUser.name.charAt(0).toUpperCase();
        }
    }
}
