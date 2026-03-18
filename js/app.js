class App {
    constructor() {
        this.db = new StorageService();
        this.authController = new AuthController(this);
        this.adminController = new AdminController(this);
        this.tutorController = new TutorController(this);
        this.studentController = new StudentController(this);
        this.forumController = new ForumController(this);

        this.currentUser = null;
        this.currentRole = null;
        this.currentView = null;
    }

    // Proxy methods for cleaner HTML onclicks
    login(role) { this.authController.login(role); }
    logout() { this.authController.logout(); }

    async navigate(view) {
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
        } else if (view === 'tutor-chat') {
            pageTitle.textContent = 'Chat con Alumnos';
            await this.tutorController.renderChat(contentArea);
        } else if (view === 'tutor-history') {
            pageTitle.textContent = 'Historial de Reuniones';
            await this.tutorController.renderHistory(contentArea);
        } else if (view === 'tutor-alerts') {
            pageTitle.textContent = 'Gestión de Alertas';
            await this.tutorController.renderAlerts(contentArea);
        } else if (view === 'student-chat') {
            pageTitle.textContent = 'Mi Tutoría';
            await this.studentController.renderChat(contentArea);
        } else if (view === 'student-alerts') {
            pageTitle.textContent = 'Mis Alertas';
            await this.studentController.renderAlertsHistory(contentArea);
        } else if (view === 'forum-list') {
            pageTitle.textContent = 'Foro de Discusión';
            await this.forumController.renderForumList(contentArea, headerActions);
        } else if (view.startsWith('forum-topic-')) {
            const topicId = view.split('forum-topic-')[1];
            pageTitle.textContent = 'Tema de Debate';
            await this.forumController.renderTopicView(contentArea, headerActions, topicId);
        }
    }
}

// Initialize App
const app = new App();
