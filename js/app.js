import { StorageService } from './services/StorageService.js';
import { AuthController } from './controllers/AuthController.js';
import { AdminController } from './controllers/AdminController.js';
import { SocialNetworkController } from './controllers/SocialNetworkController.js';
import { ChatController } from './controllers/ChatController.js';
import { ForumController } from './controllers/ForumController.js';
import { DriveController } from './controllers/DriveController.js';
import { WikiController } from './controllers/WikiController.js';
import { BookmarksController } from './controllers/BookmarksController.js';

class App {
    constructor() {
        this.db = new StorageService();
        this.authController = new AuthController(this);
        this.adminController = new AdminController(this);
        this.socialNetworkController = new SocialNetworkController(this);
        this.chatController = new ChatController(this);
        this.forumController = new ForumController(this);
        this.driveController = new DriveController(this);
        this.wikiController = new WikiController(this);
        this.bookmarksController = new BookmarksController(this);

        this.currentUser = null;
        this.currentRole = null;
        this.currentView = null;
    }

    // Proxy methods for cleaner HTML onclicks
    login(role) { this.authController.login(role); }
    logout() { this.authController.logout(); }

    async navigate(view, param = null) {
        this.currentView = view;
        const contentArea = document.getElementById('content-area');
        const pageTitle = document.getElementById('page-title');
        const headerActions = document.getElementById('header-actions');

        headerActions.innerHTML = ''; // Clear actions

        // Update Sidebar Active State
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[onclick="app.navigate('${view}')"]`);
        if (activeNav) activeNav.classList.add('active');

        if (view === 'admin-dashboard') {
            pageTitle.textContent = 'Directorio de Empleados';
            await this.adminController.renderDashboard(contentArea, headerActions);
        } else if (view === 'global-chat') {
            pageTitle.textContent = 'Chat Global';
            await this.chatController.renderGlobalChat(contentArea);
        } else if (view === 'social-network') {
            pageTitle.textContent = 'Red Social Corporativa';
            await this.socialNetworkController.renderSocialNetwork(contentArea);
        } else if (view === 'profile') {
            pageTitle.textContent = 'Perfil de Usuario';
            await this.socialNetworkController.renderProfile(contentArea, param);
        } else if (view === 'edit-profile') {
            pageTitle.textContent = 'Editar Perfil';
            await this.socialNetworkController.renderProfile(contentArea, this.currentUser.id);
            this.socialNetworkController.renderEditProfile();
        } else if (view === 'forum-list') {
            pageTitle.textContent = 'Foro';
            await this.forumController.renderForumList(contentArea, headerActions);
        } else if (view.startsWith('forum-topic-')) {
            const topicId = view.replace('forum-topic-', '');
            pageTitle.textContent = 'Tema del Foro';
            await this.forumController.renderTopicView(contentArea, headerActions, topicId);
        } else if (view === 'recursos') {
            pageTitle.textContent = 'Recursos';
            await this.driveController.renderDrive(contentArea, headerActions);
        } else if (view === 'wiki') {
            pageTitle.textContent = 'Wiki Corporativa';
            await this.wikiController.renderWiki(contentArea);
        } else if (view === 'bookmarks') {
            pageTitle.textContent = 'Marcadores';
            await this.bookmarksController.renderBookmarks(contentArea);
            
        } else if (view === 'trello-board') {
            pageTitle.textContent = 'Gestión de Tareas';
            if (headerActions) headerActions.innerHTML = '';
            
            contentArea.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; padding: 2rem;">
                    <svg viewBox="0 0 24 24" style="width: 80px; height: 80px; color: #0052CC; margin-bottom: 1.5rem;" fill="currentColor">
                        <path d="M19 3H5C3.895 3 3 3.895 3 5V19C3 20.105 3.895 21 5 21H19C20.105 21 21 20.105 21 19V5C21 3.895 20.105 3 19 3ZM10 17C10 17.552 9.552 18 9 18H6C5.448 18 5 17.552 5 17V6C5 5.448 5.448 5 6 5H9C9.552 5 10 5.448 10 6V17ZM19 12C19 12.552 18.552 13 18 13H15C14.448 13 14 12.552 14 12V6C14 5.448 14.448 5 15 5H18C18.552 5 19 5.448 19 6V12Z"></path>
                    </svg>
                    <h2 style="color: #172b4d; font-size: 1.8rem; margin-bottom: 0.5rem; font-family: 'Inter', sans-serif;">Tablero: Dpto. Implementación</h2>
                    <p style="color: #5e6c84; max-width: 500px; margin-bottom: 2.5rem; line-height: 1.6;">Por políticas de seguridad de Atlassian, la vista interactiva está aislada. Accede al espacio de trabajo seguro haciendo clic abajo.</p>
                    <a href="https://trello.com/b/DQEASsvq/dpto-implementacion-y-codigo" target="_blank" style="background-color: #0052CC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 1.1rem; transition: background 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        Abrir Tablero en Trello
                    </a>
                </div>
            `;
            
        } else if (view === 'odoo-erp') {
            pageTitle.textContent = 'Portal del Empleado (ERP)';
            if (headerActions) headerActions.innerHTML = '';
            
            contentArea.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; padding: 2rem;">
                    
                    <div style="background-color: #714B67; padding: 1.5rem; border-radius: 16px; margin-bottom: 1.5rem;">
                        <svg viewBox="0 0 24 24" style="width: 60px; height: 60px; color: white;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 8v8"></path>
                            <path d="M8 12h8"></path>
                        </svg>
                    </div>
                    
                    <h2 style="color: #1e293b; font-size: 1.8rem; margin-bottom: 0.5rem; font-family: 'Inter', sans-serif;">Odoo ERP - Clear Code</h2>
                    <p style="color: #64748b; max-width: 550px; margin-bottom: 2.5rem; line-height: 1.6;">Bienvenido al portal central de gestión. Desde aquí puedes acceder a tus nóminas, solicitar vacaciones, registrar tu jornada y gestionar los recursos del departamento. El acceso está protegido y centralizado en nuestro servidor.</p>
                    
                    <a href="http://10.0.0.1:8069" target="_blank" style="background-color: #714B67; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 1.1rem; transition: background 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        Acceder al ERP
                    </a>
                </div>
            `;
        } else if (view === 'ai-appointment') {
            pageTitle.textContent = 'Asistente IA - Agendar Cita';
            if (headerActions) headerActions.innerHTML = '';
            
            contentArea.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; padding: 2rem;">
                    
                    <div style="background-color: #10b981; padding: 1.5rem; border-radius: 16px; margin-bottom: 1.5rem;">
                        <svg viewBox="0 0 24 24" style="width: 60px; height: 60px; color: white;" fill="none" stroke="currentColor" stroke-width="2">
                           <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
                        </svg>
                    </div>
                    
                    <h2 style="color: #1e293b; font-size: 1.8rem; margin-bottom: 0.5rem; font-family: 'Inter', sans-serif;">Agenda una cita con nuestra IA</h2>
                    <p style="color: #64748b; max-width: 550px; margin-bottom: 2rem; line-height: 1.6;">Dile a nuestro asistente Llama 3 qué necesitas y cuándo te viene bien. Él se encargará de organizar tu calendario automáticamente.</p>
                    
                    <textarea id="textoCita" placeholder="Ej: Necesito una reunión técnica el jueves a las 11:00..." style="width: 100%; max-width: 500px; height: 120px; padding: 1rem; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 1rem; font-family: inherit; resize: vertical;"></textarea>
                    
                    <button onclick="app.enviarCitaIA()" style="background-color: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: background 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        Solicitar Cita a n8n
                    </button>
                    
                    <p id="mensajeRespuesta" style="margin-top: 1rem; font-weight: 600; color: #10b981;"></p>
                </div>
            `;
        }
        
    }
    async enviarCitaIA() {
        const texto = document.getElementById('textoCita').value;
        const btn = document.querySelector('button[onclick="app.enviarCitaIA()"]');
        const mensaje = document.getElementById('mensajeRespuesta');
        
        if (!texto.trim()) {
            mensaje.style.color = 'red';
            mensaje.innerText = "Por favor, escribe algo primero.";
            return;
        }

        // Cambiamos el botón para que parezca que está pensando
        btn.innerText = "Enviando a la IA...";
        btn.style.opacity = "0.7";
        mensaje.innerText = "";

        // ¡IMPORTANTE! Aquí tienes que pegar la URL que te dé el Webhook de tu n8n
        // Combinamos la IP del Samsung + el puerto + el Path de tu captura
        const urlWebhook = "http://10.0.0.5:5678/webhook/d03b3208-d945-4940-be85-a71c2ded3dc9";
        
        try {
            const respuesta = await fetch(urlWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ peticion: texto })
            });

            if (respuesta.ok) {
                mensaje.style.color = '#10b981'; // Verde de éxito
                mensaje.innerText = "¡Cita procesada por Llama 3 y registrada en el calendario!";
                document.getElementById('textoCita').value = ""; // Limpiamos la caja
            } else {
                throw new Error("Error en la respuesta del servidor");
            }
        } catch (error) {
            console.error("Error al conectar con n8n:", error);
            mensaje.style.color = 'red';
            mensaje.innerText = "Hubo un error de conexión con n8n.";
        } finally {
            // Devolvemos el botón a la normalidad
            btn.innerText = "Solicitar Cita a n8n";
            btn.style.opacity = "1";
        }
    }
}

const app = new App();
window.app = app;