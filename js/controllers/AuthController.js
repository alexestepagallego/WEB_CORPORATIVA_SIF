export class AuthController {
    constructor(app) {
        this.app = app;
        this.setupEnterListeners();
    }

    setupEnterListeners() {
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.login();
            }
        };
        
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        
        if (usernameInput) {
            usernameInput.addEventListener('keypress', handleEnter);
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('keypress', handleEnter);
        }
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
                // --- USUARIO EXISTE: VALIDAR CONTRASEÑA ---
                console.log(`Usuario encontrado: ${user.name}`);
                
                // FIX CRÍTICO: Decirle a la app quién es el usuario INMEDIATAMENTE
                this.app.currentUser = user;
                
                role = user.role || role; 
                this.app.currentRole = role;
                
                if (user.password && user.password !== password) {
                    alert('Contraseña incorrecta.');
                    this.app.currentUser = null; // Por seguridad, lo borramos si falla
                    return;
                }
                
                if (!user.password) {
                    // Guardar contraseña para usuarios antiguos (mock data)
                    user.password = password;
                    await this.app.db.saveUser(user, role);
                }
            } else {
                // --- USUARIO NO EXISTE: REGISTRAR NUEVO EMPLEADO ---
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

                // FIX CRÍTICO: Decirle a la app quién es el nuevo usuario INMEDIATAMENTE
                this.app.currentUser = user;

                await this.app.db.saveUser(user, 'employee');
                alert(`Nuevo empleado registrado exitosamente.`);
            }

            // --- PROCEDER AL LOGIN ---
            if (!this.app.currentUser) {
                alert('Error crítico: No se pudo obtener el usuario.');
                return;
            }

            // Navegar a la vista principal por defecto
            await this.app.navigate('global-chat');

            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            this.updateUserProfile();

            // Limpiar formularios
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

        // Limpiar formularios
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
            // Quitar el texto (inicial) si hay una imagen
            avatarEl.style.padding = '0';
        } else {
            avatarEl.innerHTML = this.app.currentUser.name.charAt(0).toUpperCase();
        }
    }
}