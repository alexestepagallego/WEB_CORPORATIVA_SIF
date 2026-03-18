import { StorageService } from './services/StorageService.js';
import { AuthController } from './controllers/AuthController.js';
import { AdminController } from './controllers/AdminController.js';
import { TutorController } from './controllers/TutorController.js';
import { StudentController } from './controllers/StudentController.js';
import { SocialNetworkController } from './controllers/SocialNetworkController.js';
import { ChatController } from './controllers/ChatController.js';

class App {
    constructor() {
        this.db = new StorageService();
        this.authController = new AuthController(this);
        this.adminController = new AdminController(this);
        this.tutorController = new TutorController(this);
        this.studentController = new StudentController(this);
        this.socialNetworkController = new SocialNetworkController(this);
        this.chatController = new ChatController(this);

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
            pageTitle.textContent = 'Gestión de Alumnos';
            await this.adminController.renderDashboard(contentArea, headerActions);
        } else if (view === 'global-chat') {
            pageTitle.textContent = 'Chat Global';
            await this.chatController.renderGlobalChat(contentArea);
        } else if (view === 'tutor-history') {
            pageTitle.textContent = 'Historial de Reuniones';
            await this.tutorController.renderHistory(contentArea);
        } else if (view === 'tutor-alerts') {
            pageTitle.textContent = 'Gestión de Alertas';
            await this.tutorController.renderAlerts(contentArea);
        } else if (view === 'student-alerts') {
            pageTitle.textContent = 'Mis Alertas';
            await this.studentController.renderAlertsHistory(contentArea);
        } else if (view === 'social-network') {
            pageTitle.textContent = 'Red Social';
            await this.socialNetworkController.renderSocialNetwork(contentArea);
        } else if (view === 'profile') {
            pageTitle.textContent = 'Perfil de Usuario';
            await this.socialNetworkController.renderProfile(contentArea, param);
        } else if (view === 'edit-profile') {
            pageTitle.textContent = 'Editar Perfil';
            await this.socialNetworkController.renderProfile(contentArea, this.currentUser.id);
            this.socialNetworkController.renderEditProfile();
        }
    }
}

// Initialize App
const app = new App();
window.app = app;
