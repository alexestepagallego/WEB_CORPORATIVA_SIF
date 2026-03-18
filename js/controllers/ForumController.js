class ForumController {
    constructor(app) {
        this.app = app;
        this.db = app.db;
        this.unsubscribeTopics = null;
        this.unsubscribeMessages = null;
    }

    async renderForumList(container, headerActions) {
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
            this.unsubscribeMessages = null;
        }

        container.innerHTML = `
            <div class="forum-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <p>Bienvenido al foro. Aquí puedes discutir con otros alumnos, tutores y administradores.</p>
                <button class="btn btn-primary" onclick="app.forumController.showCreateTopicModal()">Nuevo Tema</button>
            </div>
            <div id="topics-container" class="data-table" style="background:var(--bg-card); display:block; padding:1rem;">
                <p style="text-align:center; padding:2rem; color:var(--text-muted)">Cargando temas...</p>
            </div>
        `;

        headerActions.innerHTML = '';

        this.unsubscribeTopics = await this.db.subscribeToForumTopics((topics) => {
            const listContainer = document.getElementById('topics-container');
            if (!listContainer) return; // View may have changed

            if (topics.length === 0) {
                listContainer.innerHTML = `<p style="text-align:center; padding:2rem; color:var(--text-muted)">No hay temas creados. ¡Sé el primero en iniciar una discusión!</p>`;
                return;
            }

            // Using inline styles mimicking styles.css patterns for robustness
            let html = `
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--border); background:#f8fafc;">
                            <th style="padding:1rem; text-align:left; color:var(--text-muted); font-weight:600;">Tema</th>
                            <th style="padding:1rem; text-align:left; width:150px; color:var(--text-muted); font-weight:600;">Autor</th>
                            <th style="padding:1rem; text-align:center; width:100px; color:var(--text-muted); font-weight:600;">Respuestas</th>
                            <th style="padding:1rem; text-align:right; width:200px; color:var(--text-muted); font-weight:600;">Última Actividad</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            topics.forEach(t => {
                const date = t.lastActivity ? new Date(t.lastActivity).toLocaleString() : new Date(t.createdAt).toLocaleString();
                html += `
                    <tr style="border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.2s;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'" onclick="app.forumController.openTopic('${t.id}')">
                        <td style="padding:1rem;">
                            <div style="font-weight:600; color:var(--primary); font-size:1.05rem;">${t.title}</div>
                            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;">${t.description.substring(0, 100)}${t.description.length > 100 ? '...' : ''}</div>
                        </td>
                        <td style="padding:1rem; font-size:0.9rem;">
                            <div style="font-weight:500;">${t.authorName}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:capitalize;">${t.authorRole}</div>
                        </td>
                        <td style="padding:1rem; text-align:center;">
                            <span class="status-badge status-assigned" style="background:#e0f2fe; color:#0284c7;">${t.replyCount || 0}</span>
                        </td>
                        <td style="padding:1rem; text-align:right; font-size:0.85rem; color:var(--text-muted)">${date}</td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            listContainer.innerHTML = html;
        });
    }

    async openTopic(topicId) {
        await this.app.navigate('forum-topic-' + topicId);
    }

    async renderTopicView(container, headerActions, topicId) {
        if (this.unsubscribeTopics) {
            this.unsubscribeTopics();
            this.unsubscribeTopics = null;
        }

        container.innerHTML = `<div style="text-align:center; margin-top:3rem;"><div style="display:inline-block; border:3px solid #cbd5e1; border-top-color:var(--primary); border-radius:50%; width:30px; height:30px; animation:spin 1s linear infinite;"></div></div>`;
        
        const topic = await this.db.getForumTopic(topicId);
        if (!topic) {
            container.innerHTML = `<div style="padding:2rem; text-align:center;"><p style="color:var(--danger); font-size:1.1rem; font-weight:600; margin-bottom:1rem;">El tema no existe o fue eliminado.</p><button class="btn btn-outline" onclick="app.navigate('forum-list')">Volver al Foro</button></div>`;
            return;
        }

        // Action to go back
        headerActions.innerHTML = `<button class="btn btn-outline" onclick="app.navigate('forum-list')" style="display:flex; align-items:center; gap:0.5rem;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Volver</button>`;

        const topicDate = new Date(topic.createdAt).toLocaleString();

        let html = `
            <div style="background:var(--bg-card); padding:2rem; border-radius:0.5rem; box-shadow:var(--shadow); margin-bottom:1.5rem;">
                <h3 style="margin-bottom:1rem; color:var(--text-main); font-size:1.6rem;">${topic.title}</h3>
                <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1.5rem; display:flex; gap:1.5rem; align-items:center; border-bottom:1px solid var(--border); padding-bottom:1rem;">
                    <span style="display:flex; align-items:center;">
                        <span class="avatar" style="width:24px; height:24px; margin-right:0.5rem; font-size:0.7rem;">${topic.authorName.charAt(0).toUpperCase()}</span>
                        <span style="font-weight:500; color:var(--text-main);">${topic.authorName}</span>
                        <span style="margin-left:0.5rem; background:#f1f5f9; padding:0.1rem 0.4rem; border-radius:1rem; font-size:0.75rem; text-transform:capitalize;">${topic.authorRole}</span>
                    </span>
                    <span style="display:flex; align-items:center;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 
                        ${topicDate}
                    </span>
                </div>
                <div style="line-height:1.7; color:#334155; white-space:pre-wrap; font-size:1.05rem;">${topic.description}</div>
            </div>

            <h4 style="margin-bottom:1rem; font-size:1.2rem; color:var(--text-main);">Respuestas</h4>
            <div id="messages-container" style="display:flex; flex-direction:column; gap:1rem; margin-bottom:2rem;">
                <p style="text-align:center; font-size:0.9rem; color:var(--text-muted)">Cargando respuestas...</p>
            </div>

            <div style="background:var(--bg-card); padding:1.5rem; border-radius:0.5rem; box-shadow:var(--shadow);">
                <h4 style="margin-bottom:1rem; font-size:1.1rem;">Añadir Respuesta</h4>
                <textarea id="reply-input" class="login-input" rows="4" placeholder="Escribe tu respuesta aquí..." style="margin-bottom:1rem; resize:vertical; background:#f8fafc; border:1px solid var(--border);"></textarea>
                <div style="display:flex; justify-content:flex-end;">
                    <button class="btn btn-primary" onclick="app.forumController.postReply('${topic.id}')" style="display:flex; align-items:center; gap:0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        Responder
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        this.unsubscribeMessages = await this.db.subscribeToForumMessages(topicId, (messages) => {
            const msgsContainer = document.getElementById('messages-container');
            if (!msgsContainer) return;

            if (messages.length === 0) {
                msgsContainer.innerHTML = `<div style="background:#f8fafc; padding:2rem; border-radius:0.5rem; text-align:center; color:var(--text-muted); border:1px dashed var(--border);">No hay respuestas todavía. ¡Aporta la tuya!</div>`;
                return;
            }

            let msgsHtml = '';
            messages.forEach(m => {
                const date = new Date(m.createdAt).toLocaleString();
                const isMyMessage = m.authorId === this.app.currentUser.id;
                const authorInitial = m.authorName ? m.authorName.charAt(0).toUpperCase() : '?';
                
                msgsHtml += `
                    <div style="background:white; padding:1.25rem; border-radius:0.5rem; border:1px solid ${isMyMessage ? 'var(--primary)' : 'var(--border)'}; display:flex; gap:1rem;">
                        <div class="avatar" style="width:36px; height:36px; flex-shrink:0;">${authorInitial}</div>
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                                <div>
                                    <span style="font-weight:600; font-size:0.95rem; color:var(--text-main);">${m.authorName}</span> 
                                    <span style="font-size:0.75rem; background:#f1f5f9; padding:0.1rem 0.4rem; border-radius:1rem; margin-left:0.5rem; text-transform:capitalize;">${m.authorRole}</span>
                                </div>
                                <span style="font-size:0.8rem; color:var(--text-muted)">${date}</span>
                            </div>
                            <div style="line-height:1.6; color:#334155; white-space:pre-wrap; font-size:0.95rem;">${m.content}</div>
                        </div>
                    </div>
                `;
            });
            msgsContainer.innerHTML = msgsHtml;
        });
    }

    async postReply(topicId) {
        const input = document.getElementById('reply-input');
        const content = input.value.trim();
        if (!content) return;

        input.disabled = true;
        
        try {
            await this.db.createForumMessage({
                topicId: topicId,
                authorId: this.app.currentUser.id || 'unknown',
                authorName: this.app.currentUser.name || this.app.currentUser.email || 'Anónimo',
                authorRole: this.app.currentRole || 'usuario',
                content: content
            });
            input.value = '';
        } catch (e) {
            console.error("Error completo en postReply:", e);
            if (e.code === 'permission-denied') {
                alert("Error de permisos en Firebase. Asegúrate de actualizar las Reglas de Seguridad de Firestore para permitir escrituras en 'forum_topics' y 'forum_messages'.");
            } else {
                alert("Error al enviar la respuesta: " + e.message);
            }
        } finally {
            input.disabled = false;
        }
    }

    showCreateTopicModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay" id="create-topic-modal">
                <div class="modal" style="width:550px;">
                    <h2 style="font-size:1.4rem; margin-bottom:1.5rem; color:var(--text-main);">Crear Nuevo Tema</h2>
                    <div class="form-group" style="margin-bottom:1.5rem;">
                        <label style="color:var(--text-muted); font-size:0.9rem; margin-bottom:0.5rem; display:block;">Título del Tema</label>
                        <input type="text" id="topic-title" class="login-input" placeholder="Ej: Dudas sobre la Práctica 1" style="background:#f8fafc; border:1px solid var(--border);">
                    </div>
                    <div class="form-group">
                        <label style="color:var(--text-muted); font-size:0.9rem; margin-bottom:0.5rem; display:block;">Contenido</label>
                        <textarea id="topic-content" class="login-input" rows="6" placeholder="Describe tu consulta o comparte tu idea..." style="resize:vertical; background:#f8fafc; border:1px solid var(--border);"></textarea>
                    </div>
                    <div class="modal-actions" style="margin-top:2rem; border-top:1px solid var(--border); padding-top:1rem;">
                        <button class="btn btn-outline" onclick="document.getElementById('create-topic-modal').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.forumController.createTopic()">Publicar Tema</button>
                    </div>
                </div>
            </div>
        `;
    }

    async createTopic() {
        const titleInput = document.getElementById('topic-title');
        const contentInput = document.getElementById('topic-content');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            alert("Por favor, completa el título y el contenido.");
            return;
        }

        const btn = document.querySelector('#create-topic-modal .btn-primary');
        if (btn) btn.disabled = true;

        try {
            await this.db.createForumTopic({
                title: title,
                description: content,
                authorId: this.app.currentUser.id || 'unknown',
                authorName: this.app.currentUser.name || this.app.currentUser.email || 'Anónimo',
                authorRole: this.app.currentRole || 'usuario'
            });
            document.getElementById('create-topic-modal').remove();
        } catch (e) {
            console.error("Error completo en createTopic:", e);
            if (e.code === 'permission-denied') {
                alert("Error de permisos en Firebase. Asegúrate de actualizar las Reglas de Seguridad de Firestore para permitir escrituras en la colección 'forum_topics'.");
            } else {
                alert("Error al crear el tema: " + e.message);
            }
            if (btn) btn.disabled = false;
        }
    }
}
