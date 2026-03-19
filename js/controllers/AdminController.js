export class AdminController {
    constructor(app) {
        this.app = app;
    }

    async renderDashboard(container, actionsContainer) {
        this.container = container;
        this.actionsContainer = actionsContainer;
        await this.refreshView();
    }

    async refreshView() {
        const users = await this.app.db.getAllUsers();

        // 1. Header Actions
        this.actionsContainer.innerHTML = '';

        // 2. Dashboard Stats
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active' || u.status === 'assigned' || u.status === 'unassigned').length; // Assuming most are active

        let html = `
            <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem; margin-bottom:2rem;">
                <div style="background:white; padding:1.5rem; border-radius:0.5rem; box-shadow:var(--shadow);">
                    <div style="color:var(--text-muted); font-size:0.875rem;">Total Empleados</div>
                    <div style="font-size:2rem; font-weight:bold; color:var(--primary);">${totalUsers}</div>
                </div>
                <div style="background:white; padding:1.5rem; border-radius:0.5rem; box-shadow:var(--shadow);">
                    <div style="color:var(--text-muted); font-size:0.875rem;">Usuarios Activos</div>
                    <div style="font-size:2rem; font-weight:bold; color:var(--primary);">${activeUsers}</div>
                </div>
            </div>
        `;

        // 3. Content Table
        html += this.renderUsersTable(users);

        this.container.innerHTML = html;
    }

    renderUsersTable(users) {
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        users.forEach(user => {
            const roleText = user.role === 'admin' ? 'Administrador / PM' : (user.role === 'employee' ? 'Empleado' : 'Usuario');
            const statusText = 'Activo'; 

            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="avatar" style="width:32px; height:32px; font-size:12px;">
                                ${user.avatarBase64 ? `<img src="${user.avatarBase64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                ${user.name}<br><span style="font-size:0.8em; color:gray;">${user.email}</span>
                            </div>
                        </div>
                    </td>
                    <td>${roleText}</td>
                    <td><span class="status-badge status-assigned">${statusText}</span></td>
                    <td>
                        <button class="btn btn-outline" onclick="app.adminController.openEditModal('${user.id}')" title="Editar Rol">
                            ✏️
                        </button>
                    </td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        return html;
    }

    async openEditModal(userId) {
        const users = await this.app.db.getAllUsers();
        const user = users.find(u => u.id === userId);

        if (!user) return;

        const modalHtml = `
            <div class="modal-overlay" id="edit-modal" onclick="if(event.target === this) app.adminController.closeModal()">
                <div class="modal">
                    <h2>Editar Empleado</h2>
                    <p>Usuario: <strong>${user.name}</strong></p>
                    
                    <div class="form-group">
                        <label>Rol en la empresa</label>
                        <select id="user-role-select" class="form-select">
                            <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>Empleado</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador / PM</option>
                        </select>
                    </div>

                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="app.adminController.closeModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.adminController.saveUserEdit('${userId}')">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modal-container').innerHTML = modalHtml;
    }

    async saveUserEdit(userId) {
        const newRole = document.getElementById('user-role-select').value;
        
        await this.app.db.updateUserProfile(userId, { role: newRole });
        
        // If current user editing themselves, update session
        if (this.app.currentUser.id === userId) {
            this.app.currentRole = newRole;
            this.app.currentUser.role = newRole;
            this.app.authController.updateUserProfile();
        }

        this.closeModal();
        this.refreshView();
    }

    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    }
}
