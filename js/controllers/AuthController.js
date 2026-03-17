class AuthController {
    constructor(app) {
        this.app = app;
        this.selectedRole = null;
    }

    showLoginForm(role) {
        this.selectedRole = role;
        document.getElementById('role-selection').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');

        // Focus on username input
        setTimeout(() => document.getElementById('username-input').focus(), 100);
    }

    backToRoles() {
        this.selectedRole = null;
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('role-selection').classList.remove('hidden');
        document.getElementById('username-input').value = '';
        document.getElementById('password-input').value = '';
    }

    async login() {
        const username = document.getElementById('username-input').value.trim();
        const password = document.getElementById('password-input').value.trim();

        if (!username || !password) {
            alert('Por favor, introduzca nombre de usuario y contraseña.');
            return;
        }

        if (!this.selectedRole) {
            alert('Error: No se ha seleccionado ningún rol. Por favor, recargue la página.');
            return;
        }

        await this.authenticate(username, password, this.selectedRole);
    }

    async authenticate(username, password, role) {
        try {
            this.app.currentRole = role;
            let user = null;
            let usersList = [];

            // 1. Fetch Users based on Role
            if (role === 'admin') {
                usersList = await this.app.db.getAdmins();
            } else if (role === 'tutor') {
                usersList = await this.app.db.getTutors();
            } else if (role === 'student') {
                usersList = await this.app.db.getStudents();
            }

            // 2. Find User
            user = usersList.find(u => u.email === username || u.name === username);

            if (user) {
                // --- USER EXISTS: VALIDATE PASSWORD ---
                console.log(`Usuario encontrado: ${user.name}`);
                if (user.password && user.password !== password) {
                    alert('Contraseña incorrecta.');
                    return;
                }
                // If user has no password saved (legacy data), we might allow or update it. 
                // For now, we assume if it exists, it's correct.
                if (!user.password) {
                    // Start saving password for legacy
                    user.password = password;
                    await this.app.db.saveUser(user, role);
                }
            } else {
                // --- USER DOES NOT EXIST: REGISTER NEW USER ---
                console.log("Usuario no encontrado. Registrando nuevo usuario...");

                user = {
                    id: `${role}_${Date.now()}`,
                    name: username.includes('@') ? username.split('@')[0] : username,
                    email: username,
                    password: password, // Save the password
                    role: role
                };

                if (role === 'student') {
                    user.status = 'unassigned';
                    user.assignedTutorId = null;
                }

                await this.app.db.saveUser(user, role);
                alert(`Nuevo ${role} registrado exitosamente.`);
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
        this.selectedRole = null;
        document.getElementById('app').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');

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

        this.backToRoles();
    }

    updateUserProfile() {
        if (!this.app.currentUser) return;

        document.getElementById('user-name').textContent = this.app.currentUser.name;
        let roleName = 'Usuario';
        if (this.app.currentRole === 'admin') roleName = 'Administrador';
        if (this.app.currentRole === 'tutor') roleName = 'Tutor Académico';
        if (this.app.currentRole === 'student') roleName = 'Estudiante';

        document.getElementById('user-role').textContent = roleName;
        document.getElementById('user-avatar').textContent = this.app.currentUser.name.charAt(0).toUpperCase();
    }
}
