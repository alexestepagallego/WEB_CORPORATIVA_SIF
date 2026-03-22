export class ChatController {
    constructor(app) {
        this.app = app;
        this.globalChatUnsubscribe = null;
    }

    async renderGlobalChat(container) {
        // Clear previous view content
        container.innerHTML = `
            <div class="chat-layout" style="margin: 0 auto; max-width: 1200px;">
                <div class="chat-main" style="width: 100%;">
                    <div class="chat-header" id="chat-header-name">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Chat Global - Canal General
                        <span style="float:right; font-size: 0.8rem; font-weight: 400; color: var(--secondary); margin-top: 4px;">Todos los miembros</span>
                    </div>
                    <div class="chat-messages" id="chat-messages-area" style="background-color: var(--bg-body);">
                        <div style="text-align:center; color:gray; margin-top:2rem;">Cargando mensajes...</div>
                    </div>
                    <div class="chat-input-area">
                        <input type="text" id="message-input" class="chat-input" placeholder="Escribe un mensaje al canal global..." disabled onkeypress="if(event.key === 'Enter') app.chatController.sendMessage()">
                        <button class="btn btn-primary" id="send-btn" disabled onclick="app.chatController.sendMessage()">Enviar</button>
                    </div>
                </div>
            </div>
        `;

        await this.loadGlobalMessages();
    }

    async loadGlobalMessages() {
        // Unsubscribe previous listener if it exists
        if (this.globalChatUnsubscribe) {
            this.globalChatUnsubscribe();
            this.globalChatUnsubscribe = null;
        }

        const currentUser = this.app.currentUser;

        // Subscribe to real-time global messages
        this.globalChatUnsubscribe = await this.app.db.subscribeToGlobalMessages((messages) => {
            const messagesArea = document.getElementById('chat-messages-area');
            if (!messagesArea) return; // Guard clause if view changed
            messagesArea.innerHTML = '';

            if (messages.length === 0) {
                messagesArea.innerHTML = '<div style="text-align:center; color:gray; margin-top:1rem;">No hay mensajes en el chat global. ¡Sé el primero en escribir!</div>';
            } else {
                messages.forEach(msg => {
                    const isOwnMessage = msg.authorId === currentUser.id;
                    const div = document.createElement('div');
                    
                    // We can reuse the sent/received styling. "sent" is for our own messages, "received" is for others.
                    div.className = `message ${isOwnMessage ? 'sent' : 'received'}`;
                    
                    // To make it distinct who sent the message (since it's a group chat)
                    let authorNameHtml = '';
                    if (!isOwnMessage) {
                        authorNameHtml = `<div style="font-size: 0.75rem; font-weight: bold; margin-bottom: 4px; color: var(--primary-dark);">${msg.authorName}</div>`;
                    }

                    let deleteBtnHtml = '';
                    if (this.app.currentRole === 'admin') {
                        deleteBtnHtml = `<button onclick="app.chatController.deleteMessage('${msg.id}')" title="Borrar Mensaje" style="background:none; border:none; cursor:pointer; color:var(--danger); padding:0; margin-left:8px; float:right;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>`;
                    }

                    div.innerHTML = `
                        ${deleteBtnHtml}
                        ${authorNameHtml}
                        ${msg.text}
                        <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    `;
                    messagesArea.appendChild(div);
                });
            }
            // Auto-scroll to bottom
            messagesArea.scrollTop = messagesArea.scrollHeight;
        });

        // Enable inputs
        document.getElementById('message-input').disabled = false;
        document.getElementById('send-btn').disabled = false;
        document.getElementById('message-input').focus();
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        if (!text) return;

        const msgData = {
            authorId: this.app.currentUser.id,
            authorName: this.app.currentUser.name || this.app.currentUser.email,
            text: text,
            timestamp: new Date().toISOString()
        };

        input.disabled = true;
        document.getElementById('send-btn').disabled = true;

        try {
            await this.app.db.addGlobalMessage(msgData);
            input.value = '';
        } catch (error) {
            console.error("Error sending global message", error);
            alert("Error al enviar el mensaje.");
        } finally {
            input.disabled = false;
            document.getElementById('send-btn').disabled = false;
            input.focus();
        }
    }

    async deleteMessage(id) {
        if (!confirm('¿Estás seguro de que quieres borrar este mensaje?')) return;
        try {
            await this.app.db.deleteChatMessage(id);
        } catch (error) {
            console.error("Error deleting message", error);
        }
    }
}
