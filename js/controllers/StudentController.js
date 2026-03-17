class StudentController {
    constructor(app) {
        this.app = app;
    }

    async renderChat(container) {
        const student = this.app.currentUser;
        const tutorId = student.assignedTutorId;

        container.innerHTML = `
            <div class="chat-layout">
                <div class="chat-sidebar">
                    <div class="chat-header">
                        <span>Mis Chats</span>
                        <button class="btn btn-sm btn-primary" style="float:right; padding: 0.2rem 0.5rem; font-size: 0.7rem;" onclick="app.studentController.startNewChat()">+ Nuevo</button>
                    </div>
                    <div class="chat-list" id="chat-list-area">
                        <!-- Chat list will be populated here -->
                    </div>
                </div>
                <div class="chat-main">
                    <div class="chat-header" id="chat-header-title">Selecciona un chat</div>
                    <div class="chat-messages" id="chat-messages-area">
                        <div style="text-align:center; color:gray; margin-top:2rem;">Selecciona un chat para comenzar</div>
                    </div>
                    <div class="chat-input-area">
                        <input type="text" id="message-input" class="chat-input" placeholder="Escribe un mensaje..." disabled onkeypress="if(event.key === 'Enter') app.studentController.sendMessage()">
                        <button class="btn btn-primary" id="send-btn" disabled onclick="app.studentController.sendMessage()">Enviar</button>
                    </div>
                </div>
            </div>
        `;

        await this.loadChatList();

        // Auto-select tutor chat if assigned
        if (tutorId) {
            await this.selectChat(tutorId);
        }
    }

    async loadChatList() {
        const student = this.app.currentUser;
        const tutorId = student.assignedTutorId;
        const listArea = document.getElementById('chat-list-area');
        listArea.innerHTML = '';

        if (tutorId) {
            const tutors = await this.app.db.getTutors();
            const tutor = tutors.find(t => t.id === tutorId);
            if (tutor) {
                const div = document.createElement('div');
                div.className = 'chat-item';
                div.id = `chat-item-${tutorId}`;
                div.onclick = () => this.selectChat(tutorId);
                div.innerHTML = `
                    <div style="font-weight:600;">${tutor.name}</div>
                    <div style="font-size:0.8rem; color:gray;">Tutor Académico</div>
                `;
                listArea.appendChild(div);
            }
        } else {
            listArea.innerHTML = '<div style="padding:1rem; color:gray; font-size:0.9rem;">No tienes tutor asignado.</div>';
        }
    }

    startNewChat() {
        const student = this.app.currentUser;
        if (!student.assignedTutorId) {
            alert('No tienes un tutor asignado con quien iniciar chat.');
            return;
        }
        // Since student can ONLY chat with tutor, just open that chat
        this.selectChat(student.assignedTutorId);
    }

    async selectChat(tutorId) {
        this.currentChatTutorId = tutorId;

        // Update UI active state
        document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.getElementById(`chat-item-${tutorId}`);
        if (activeItem) activeItem.classList.add('active');

        const tutors = await this.app.db.getTutors();
        const tutor = tutors.find(t => t.id === tutorId);
        document.getElementById('chat-header-title').textContent = `Chat con ${tutor ? tutor.name : 'Tutor'}`;

        this.loadChatMessages();

        // Enable inputs
        document.getElementById('message-input').disabled = false;
        document.getElementById('send-btn').disabled = false;
        document.getElementById('message-input').focus();
    }

    async loadChatMessages() {
        const studentId = this.app.currentUser.id;
        const tutorId = this.app.currentUser.assignedTutorId;

        // Unsubscribe previous listener if exists
        if (this.chatUnsubscribe) {
            this.chatUnsubscribe();
            this.chatUnsubscribe = null;
        }

        // Subscribe to real-time messages
        this.chatUnsubscribe = await this.app.db.subscribeToChatMessages(studentId, tutorId, (messages) => {
            const messagesArea = document.getElementById('chat-messages-area');
            if (!messagesArea) return;
            messagesArea.innerHTML = '';

            if (messages.length === 0) {
                messagesArea.innerHTML = '<div style="text-align:center; color:gray; margin-top:1rem;">No hay mensajes previos.</div>';
            } else {
                messages.forEach(msg => {
                    const isMe = msg.sender === 'student';
                    const div = document.createElement('div');
                    div.className = `message ${isMe ? 'sent' : 'received'}`;
                    // If it's me (student), style as 'sent', otherwise 'received'
                    // Note: In CSS 'sent' is primary color (right), 'received' is white (left).

                    div.innerHTML = `
                        ${msg.text}
                        <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    `;
                    messagesArea.appendChild(div);
                });
            }
            messagesArea.scrollTop = messagesArea.scrollHeight;
        });
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        if (!text) return;

        const studentId = this.app.currentUser.id;
        const tutorId = this.app.currentUser.assignedTutorId;

        const msg = {
            studentId: studentId,
            tutorId: tutorId,
            sender: 'student',
            text: text,
            timestamp: new Date().toISOString()
        };

        await this.app.db.addChatMessage(msg);
        input.value = '';
        // Real-time listener handles update
    }

    // --- ALERTS MODULE ---

    async initAlerts() {
        const student = this.app.currentUser;
        // Should only be called if student is logged in and has assigned tutor (or logic to handle unassigned)
        if (!student.assignedTutorId) return;

        if (this.alertsUnsubscribe) this.alertsUnsubscribe();

        this.alertsUnsubscribe = await this.app.db.subscribeToStudentAlerts(student.id, student.assignedTutorId, (alerts) => {
            this.renderActiveAlerts(alerts);
        });
    }

    renderActiveAlerts(alerts) {
        const container = document.getElementById('alert-container');
        if (!container) return;
        container.innerHTML = '';

        // Filter alerts that I haven't seen yet
        const myId = this.app.currentUser.id;
        const unseenAlerts = alerts.filter(a => !a.vistoPor || !a.vistoPor.includes(myId));

        if (unseenAlerts.length === 0) return;

        // Prioritize Urgent
        unseenAlerts.forEach(alert => {
            const el = document.createElement('div');
            const isUrgent = alert.prioridad === 'urgente';
            el.className = isUrgent ? 'alerta-urgente' : 'alerta-normal';

            const icon = isUrgent
                ? '<span style="font-size:1.5rem; margin-right:0.5rem;">⚠️</span>'
                : '<span style="font-size:1.2rem; margin-right:0.5rem;">📢</span>';

            el.innerHTML = `
                <div style="flex:1;">
                    <div class="alerta-header">
                        ${icon}
                        <span>${alert.asunto}</span>
                    </div>
                    <div>${alert.mensaje}</div>
                    <div style="font-size:0.75rem; margin-top:0.5rem; opacity:0.8;">
                        ${new Date(alert.fecha).toLocaleString()}
                    </div>
                </div>
                <button class="alerta-close" onclick="app.studentController.dismissAlert('${alert.id}')">✕</button>
            `;
            container.appendChild(el);
        });
    }

    async dismissAlert(alertId) {
        await this.app.db.markAlertAsSeen(alertId, this.app.currentUser.id);
    }

    // New History View
    async renderAlertsHistory(container) {
        const student = this.app.currentUser;
        if (!student.assignedTutorId) {
            container.innerHTML = '<div style="padding:2rem; text-align:center;">No tienes un tutor asignado.</div>';
            return;
        }

        container.innerHTML = '<h2>Mis Alertas Recibidas</h2><div id="student-alerts-list">Cargando...</div>';

        // We can reuse subscribeToStudentAlerts but we need a one-time fetch slightly modified or just use the sub callback once?
        // Let's use getDocs manually or reuse subscription?
        // Let's create a one-off fetch for history to avoid subscription overhead on history view if we don't need real-time updates there?
        // Actually, reusing the existing subscription mechanism is fine if we just render once.
        // But better: use a dedicated simple subscription for the view if needed, or just a one-time fetch.
        // Let's implement a simple getStudentAlerts in StorageService if it doesn't exist, OR use same logic.

        // Reuse the logic from StorageService manually here for simplicity or add a method.
        // Let's add functionality to StorageService to get alerts without subscribe? 
        // No, let's just use the subscription for consistent Real-time history.

        if (this.historyUnsubscribe) this.historyUnsubscribe();

        this.historyUnsubscribe = await this.app.db.subscribeToStudentAlerts(student.id, student.assignedTutorId, (alerts) => {
            const listContainer = document.getElementById('student-alerts-list');
            if (!listContainer) return;

            // Filter logic (already done in service partially, but let's double check)
            // Service returns "TODOS" or specific.
            // We want ALL history here, seen or unseen.

            if (alerts.length === 0) {
                listContainer.innerHTML = '<div style="padding:1rem; color:gray;">No has recibido alertas.</div>';
                return;
            }

            let html = '<table class="data-table"><thead><tr><th>Fecha</th><th>Asunto</th><th>Prioridad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
            alerts.forEach(a => {
                const dateStr = new Date(a.fecha).toLocaleString();
                const priorityClass = a.prioridad === 'urgente' ? 'status-unassigned' : 'status-assigned';
                const isSeen = a.vistoPor && a.vistoPor.includes(student.id);
                const statusBadge = isSeen
                    ? '<span class="status-badge status-assigned">Visto</span>'
                    : '<span class="status-badge status-unassigned">Pendiente</span>';

                html += `
                    <tr>
                        <td>${dateStr}</td>
                        <td>${a.asunto}</td>
                        <td><span class="status-badge ${priorityClass}">${a.prioridad.toUpperCase()}</span></td>
                        <td>${statusBadge}</td>
                        <td>
                            <button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="app.studentController.confirmDeleteAlert('${a.id}')" title="Eliminar para mí">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            listContainer.innerHTML = html;
        });
    }

    async confirmDeleteAlert(alertId) {
        if (confirm("¿Deseas eliminar esta alerta? No volverás a verla.")) {
            await this.app.db.deleteAlert(alertId, this.app.currentUser.id, false);
        }
    }
}
