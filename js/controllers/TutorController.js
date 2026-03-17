class TutorController {
    constructor(app) {
        this.app = app;
        this.selectedStudentChat = null;
    }

    async renderChat(container) {
        const students = await this.app.db.getStudents();
        // Filter students assigned to current tutor
        const myStudents = students.filter(s => s.assignedTutorId === this.app.currentUser.id);

        container.innerHTML = `
            <div class="chat-layout">
                <div class="chat-sidebar">
                    <div class="chat-header">
                        <span>Mis Alumnos</span>
                        <button class="btn btn-sm btn-primary" style="float:right; padding: 0.2rem 0.5rem; font-size: 0.7rem;" onclick="app.tutorController.startNewChat()">+ Nuevo</button>
                    </div>
                    <div class="chat-list" id="chat-student-list">
                        ${myStudents.length === 0 ? '<div style="padding:1rem; color:gray;">No tienes alumnos asignados.</div>' : ''}
                        ${myStudents.map(s => `
                            <div class="chat-item ${this.selectedStudentChat === s.id ? 'active' : ''}" onclick="app.tutorController.selectChat('${s.id}')">
                                <div style="font-weight:600;">${s.name}</div>
                                <div style="font-size:0.8rem; color:gray;">${s.email}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="chat-main">
                    <div class="chat-header" id="chat-header-name">Selecciona un alumno</div>
                    <div class="chat-messages" id="chat-messages-area">
                        <div style="text-align:center; color:gray; margin-top:2rem;">Selecciona un alumno para ver el historial</div>
                    </div>
                    <div class="chat-input-area">
                        <input type="text" id="message-input" class="chat-input" placeholder="Escribe un mensaje..." disabled onkeypress="if(event.key === 'Enter') app.tutorController.sendMessage()">
                        <button class="btn btn-primary" id="send-btn" disabled onclick="app.tutorController.sendMessage()">Enviar</button>
                    </div>
                </div>
            </div>
        `;

        if (this.selectedStudentChat) {
            await this.loadChatMessages(this.selectedStudentChat);
        }
    }

    async startNewChat() {
        const students = await this.app.db.getStudents();
        const myStudents = students.filter(s => s.assignedTutorId === this.app.currentUser.id);

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="modal">
                    <h2>Iniciar Nuevo Chat</h2>
                    <div class="form-group">
                        <label>Selecciona un alumno:</label>
                        <select id="new-chat-student-select" class="form-select">
                            ${myStudents.map(s => `<option value="${s.id}">${s.name} (${s.email})</option>`).join('')}
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="document.getElementById('modal-container').innerHTML = ''">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.tutorController.confirmNewChat()">Iniciar</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modal-container').innerHTML = modalHtml;
    }

    confirmNewChat() {
        const select = document.getElementById('new-chat-student-select');
        const studentId = select.value;
        if (studentId) {
            this.selectChat(studentId);
            document.getElementById('modal-container').innerHTML = '';
        }
    }

    selectChat(studentId) {
        this.selectedStudentChat = studentId;
        // Update UI active state
        document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
        // Find the element clicked (simplification for re-render)
        this.renderChat(document.getElementById('content-area'));
        this.loadChatMessages(studentId);
    }

    async loadChatMessages(studentId) {
        const students = await this.app.db.getStudents();
        const student = students.find(s => s.id === studentId);
        document.getElementById('chat-header-name').textContent = `Chat con ${student.name}`;

        // Unsubscribe previous listener if exists
        if (this.chatUnsubscribe) {
            this.chatUnsubscribe();
            this.chatUnsubscribe = null;
        }

        // Subscribe to real-time messages
        this.chatUnsubscribe = await this.app.db.subscribeToChatMessages(studentId, this.app.currentUser.id, (messages) => {
            const messagesArea = document.getElementById('chat-messages-area');
            if (!messagesArea) return; // Guard clause if view changed
            messagesArea.innerHTML = '';

            if (messages.length === 0) {
                messagesArea.innerHTML = '<div style="text-align:center; color:gray; margin-top:1rem;">No hay mensajes previos.</div>';
            } else {
                messages.forEach(msg => {
                    const div = document.createElement('div');
                    div.className = `message ${msg.sender === 'tutor' ? 'sent' : 'received'}`;
                    div.innerHTML = `
                        ${msg.text}
                        <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    `;
                    messagesArea.appendChild(div);
                });
            }
            messagesArea.scrollTop = messagesArea.scrollHeight;
        });

        // Enable inputs
        document.getElementById('message-input').disabled = false;
        document.getElementById('send-btn').disabled = false;
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        if (!text || !this.selectedStudentChat) return;

        const msg = {
            studentId: this.selectedStudentChat,
            tutorId: this.app.currentUser.id,
            sender: 'tutor',
            text: text,
            timestamp: new Date().toISOString()
        };

        await this.app.db.addChatMessage(msg);
        input.value = '';
        // No need to reload manually, onSnapshot handles it
    }

    async renderHistory(container) {
        const meetings = await this.app.db.getMeetings();
        const students = await this.app.db.getStudents();
        // Filter meetings for this tutor
        const myMeetings = meetings.filter(m => m.tutorId === this.app.currentUser.id);

        let html = `
            <h2>Historial de Reuniones</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Alumno</th>
                        <th>Tema</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (myMeetings.length === 0) {
            html += `<tr><td colspan="3" style="text-align:center;">No hay reuniones registradas.</td></tr>`;
        } else {
            myMeetings.forEach(m => {
                const student = students.find(s => s.id === m.studentId);
                html += `
                    <tr>
                        <td>${m.date}</td>
                        <td>${student ? student.name : 'Desconocido'}</td>
                        <td>${m.topic}</td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    // --- ALERTS MODULE ---

    async renderAlerts(container) {
        // Clean up explicit chat subscription if active
        if (this.chatUnsubscribe) {
            this.chatUnsubscribe();
            this.chatUnsubscribe = null;
        }

        const students = await this.app.db.getStudents();
        const myStudents = students.filter(s => s.assignedTutorId === this.app.currentUser.id);

        container.innerHTML = `
            <h2>Envío de Alertas Prioritarias</h2>
            
            <div class="alert-form-card">
                <div class="form-group">
                    <label>Asunto</label>
                    <input type="text" id="alert-subject" class="form-select" style="position:static;" placeholder="Ej: Cambio de horario tutoría">
                </div>
                
                <div class="form-group">
                    <label>Mensaje</label>
                    <textarea id="alert-message" class="form-select" style="position:static; height:100px; resize:vertical;" placeholder="Escribe el mensaje importante aqui..."></textarea>
                </div>

                <div class="form-group">
                    <label>Prioridad</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="alert-priority" value="normal" checked>
                            <span style="color:#1e40af; font-weight:600;">Normal</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="alert-priority" value="urgente">
                            <span style="color:#991b1b; font-weight:600;">URGENTE</span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label>Destinatarios</label>
                    <div style="margin-bottom:0.5rem;">
                        <label class="radio-label">
                            <input type="checkbox" id="alert-all-students" onchange="document.getElementById('alert-specific-students').disabled = this.checked">
                            Enviar a todos mis alumnos (${myStudents.length})
                        </label>
                    </div>
                    <select id="alert-specific-students" class="form-select" multiple style="position:static; height:100px;">
                        ${myStudents.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                    <div style="font-size:0.8rem; color:gray; margin-top:0.2rem;">Mantén Ctrl para seleccionar múltiples</div>
                </div>

                <div style="text-align:right;">
                    <button class="btn btn-primary" onclick="app.tutorController.sendAlert()">Enviar Alerta</button>
                </div>
            </div>

            <h3>Historial de Alertas Enviadas</h3>
            <div id="alerts-history-list">
                <div style="text-align:center; padding:1rem; color:gray;">Cargando historial...</div>
            </div>
        `;

        // Subscribe to alert history
        if (this.alertsUnsubscribe) this.alertsUnsubscribe();
        this.alertsUnsubscribe = await this.app.db.subscribeToTutorAlerts(this.app.currentUser.id, (alerts) => {
            const historyContainer = document.getElementById('alerts-history-list');
            if (!historyContainer) return;

            if (alerts.length === 0) {
                historyContainer.innerHTML = '<div style="text-align:center; padding:1rem; color:gray;">No has enviado ninguna alerta.</div>';
                return;
            }

            let html = '<table class="data-table"><thead><tr><th>Fecha</th><th>Asunto</th><th>Prioridad</th><th>Visto por</th><th>Acciones</th></tr></thead><tbody>';
            alerts.forEach(a => {
                const dateStr = new Date(a.fecha).toLocaleString();
                const priorityClass = a.prioridad === 'urgente' ? 'status-unassigned' : 'status-assigned';
                const countSeen = a.vistoPor ? a.vistoPor.length : 0;

                html += `
                    <tr>
                        <td>${dateStr}</td>
                        <td>${a.asunto}</td>
                        <td><span class="status-badge ${priorityClass}">${a.prioridad.toUpperCase()}</span></td>
                        <td><span class="stats-counter">${countSeen} alumnos</span></td>
                        <td>
                            <button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="app.tutorController.initDeleteAlert('${a.id}')" title="Eliminar Alerta">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            historyContainer.innerHTML = html;
        });
    }

    initDeleteAlert(alertId) {
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="modal">
                    <h2>Eliminar Alerta</h2>
                    <p>¿Cómo deseas eliminar esta alerta?</p>
                    
                    <div style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                        <button class="btn btn-outline" onclick="app.tutorController.confirmDelete('${alertId}', false)">
                            Eliminar solo para mí (Ocultar)
                        </button>
                        <button class="btn btn-primary" style="background:var(--danger); border-color:var(--danger);" onclick="app.tutorController.confirmDelete('${alertId}', true)">
                            Eliminar para TODOS (Deshacer envío)
                        </button>
                    </div>
                     <div style="text-align:right; margin-top:1rem;">
                        <button class="btn btn-link" onclick="document.getElementById('modal-container').innerHTML = ''">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modal-container').innerHTML = modalHtml;
    }

    async confirmDelete(alertId, forEveryone) {
        if (forEveryone && !confirm("¿Estás seguro de ELIMINAR esta alerta para TODOS los alumnos? Desaparecerá de sus listas.")) {
            return;
        }

        try {
            await this.app.db.deleteAlert(alertId, this.app.currentUser.id, forEveryone);
            document.getElementById('modal-container').innerHTML = '';
            // Subscription auto-updates the list
        } catch (e) {
            console.error(e);
            alert("Error al eliminar la alerta.");
        }
    }

    async sendAlert() {
        console.log("Intentando enviar alerta...");
        const subjectInput = document.getElementById('alert-subject');
        const messageInput = document.getElementById('alert-message');
        const priorityInput = document.querySelector('input[name="alert-priority"]:checked');
        const allStudentsInput = document.getElementById('alert-all-students');
        const specificStudentsSelect = document.getElementById('alert-specific-students');

        if (!subjectInput || !messageInput) {
            console.error("No se encontraron los elementos del formulario.");
            return;
        }

        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();
        const priority = priorityInput ? priorityInput.value : 'normal';
        const sendToAll = allStudentsInput.checked;

        let recipients = [];
        if (sendToAll) {
            recipients = 'TODOS';
        } else {
            recipients = Array.from(specificStudentsSelect.selectedOptions).map(opt => opt.value);
        }

        if (!subject || !message) {
            alert('Por favor, completa el asunto y el mensaje.');
            return;
        }

        if (recipients !== 'TODOS' && recipients.length === 0) {
            alert('Por favor, selecciona al menos un destinatario o "Todos".');
            return;
        }

        const alertData = {
            tutorId: this.app.currentUser.id,
            asunto: subject,
            mensaje: message,
            prioridad: priority,
            destinatarios: recipients
        };

        try {
            await this.app.db.sendAlert(alertData);
            console.log("Alerta enviada:", alertData);
            alert('¡Alerta enviada correctamente!');

            // Reset form
            subjectInput.value = '';
            messageInput.value = '';
            allStudentsInput.checked = false;
            specificStudentsSelect.disabled = false;
            specificStudentsSelect.selectedIndex = -1;
            // Reset priority to normal
            const normalRadio = document.querySelector('input[name="alert-priority"][value="normal"]');
            if (normalRadio) normalRadio.checked = true;

        } catch (e) {
            console.error("Error al enviar alerta:", e);
            alert('Error al enviar la alerta: ' + e.message);
        }
    }
}
