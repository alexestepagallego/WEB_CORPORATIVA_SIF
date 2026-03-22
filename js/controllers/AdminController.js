export class AdminController {
    constructor(app) {
        this.app = app;
    }

    async renderDashboard(container, actionsContainer) {
        if (this.app.currentRole !== 'admin') {
            alert('Acceso Denegado. No tienes permisos de administrador.');
            await this.app.navigate('global-chat');
            return;
        }
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
                    <td>
                        <select class="form-select" style="padding: 0.25rem; font-size: 0.85rem;" onchange="app.adminController.changeUserRole('${user.id}', this.value)">
                            <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>Empleado</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador / PM</option>
                        </select>
                    </td>
                    <td><span class="status-badge status-assigned">${statusText}</span></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="app.adminController.deleteUser('${user.id}')" title="Expulsar / Eliminar Usuario" style="padding: 0.25rem 0.5rem; background-color: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg> Expulsar
                        </button>
                    </td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        return html;
    }

    async changeUserRole(userId, newRole) {
        if (!confirm('¿Estás seguro de que quieres cambiar el rol de este usuario?')) return;
        
        await this.app.db.updateUserRole(userId, newRole);
        
        // If current user editing themselves, update session
        if (this.app.currentUser && this.app.currentUser.id === userId) {
            this.app.currentRole = newRole;
            this.app.currentUser.role = newRole;
            if (this.app.authController && this.app.authController.updateUserProfile) {
                this.app.authController.updateUserProfile();
            }
        }

        this.refreshView();
    }

    async deleteUser(userId) {
        if (!confirm('ATENCIÓN: ¿Estás seguro de que quieres eliminar a este usuario completamente de la plataforma? Esta acción no se puede deshacer.')) return;
        
        await this.app.db.deleteUser(userId);
        
        // If they delete themselves (edge case) we might want to log them out,
        // but typically they don't do that.
        this.refreshView();
    }
}
