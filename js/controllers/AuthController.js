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
            let role = 'employee';

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
                console.log("Usuario no encontrado. Registrando nuevo empleado por defecto...");
                this.app.currentRole = 'employee';

                user = {
                    id: `user_${Date.now()}`,
                    name: username.includes('@') ? username.split('@')[0] : username,
                    email: username,
                    password: password, 
                    role: 'employee',
                    status: 'active'
                };

                await this.app.db.saveUser(user, 'employee');
                alert(`Nuevo empleado registrado exitosamente.`);
            }

            // --- PROCEED TO LOGIN ---
            if (!user) {
                alert('Error crítico: No se pudo obtener el usuario.');
                return;
            }

            // CRITICAL FIX: Set currentUser BEFORE navigating
            this.app.currentUser = user;

            // Navigate to default main view (fixes blank screen bug)
            await this.app.navigate('global-chat');

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

        // No role-specific UI to hide/show since navbar is unified
        // Clear forms
        document.getElementById('username-input').value = '';
        document.getElementById('password-input').value = '';
    }

    updateUserProfile() {
        if (!this.app.currentUser) return;

        document.getElementById('user-name').textContent = this.app.currentUser.name;
        document.getElementById('user-role').textContent = 'Empleado';
        
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
