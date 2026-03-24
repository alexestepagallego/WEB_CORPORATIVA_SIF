export class WikiController {
    constructor(app) {
        this.app = app;
    }

    async renderWiki(container) {
        container.innerHTML = `
            <style>
                .wiki-base {
                    font-family: 'Inter', 'Open Sans', system-ui, sans-serif;
                    background-color: transparent;
                    color: #1e293b;
                    padding: 0 1rem 2rem 1rem;
                }
                
                /* Global Header */
                .wiki-global-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .wiki-global-title {
                    margin: 0;
                    color: #0f172a;
                    font-size: 2.2rem;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                }
                .wiki-btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background-color: #2563eb;
                    color: #ffffff;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.95rem;
                    transition: background-color 0.2s, transform 0.1s, box-shadow 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
                }
                .wiki-btn-primary:hover {
                    background-color: #1d4ed8;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
                }

                /* Nav Tabs */
                .wiki-nav {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    border-bottom: 2px solid #e2e8f0;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .wiki-nav::-webkit-scrollbar { display: none; }
                .wiki-tab {
                    background: none;
                    border: none;
                    padding: 0.75rem 1.25rem;
                    cursor: pointer;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.95rem;
                    position: relative;
                    white-space: nowrap;
                    transition: all 0.3s ease;
                    outline: none;
                }
                .wiki-tab:hover {
                    color: #0f172a;
                    background-color: #f8fafc;
                    border-radius: 8px 8px 0 0;
                }
                .wiki-tab.active {
                    color: #2563eb;
                }
                .wiki-tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background-color: #2563eb;
                    border-radius: 2px 2px 0 0;
                }

                /* Container */
                .wiki-content {
                    background: #ffffff;
                    padding: 2.5rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    min-height: 500px;
                }
                .wiki-section {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Typography */
                .wiki-title { margin-top: 0; color: #0f172a; font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; }
                .wiki-subtitle { color: #64748b; font-size: 1.1rem; margin-bottom: 2rem; }
                .wiki-h3 { color: #0f172a; font-size: 1.25rem; font-weight: 600; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; letter-spacing: -0.01em; }

                /* Grids & Cards */
                .wiki-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                .wiki-grid-2x2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }
                .wiki-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02);
                    transition: transform 0.2s, box-shadow 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .wiki-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04);
                    transform: translateY(-2px);
                }
                .wiki-card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }
                .wiki-card-icon {
                    width: 40px; height: 40px;
                    background: #f1f5f9;
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    color: #2563eb;
                }
                .wiki-card-title { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 0; }
                .wiki-card-text { color: #475569; line-height: 1.6; font-size: 0.95rem; margin: 0; }
                
                /* Timeline Component */
                .wiki-timeline {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin: 2rem 0;
                    position: relative;
                }
                .wiki-timeline::before {
                    content: '';
                    position: absolute;
                    top: 20px; left: 0; right: 0;
                    height: 2px;
                    background: #e2e8f0;
                    z-index: 1;
                }
                .wiki-timeline-step {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    width: 20%;
                }
                .wiki-timeline-circle {
                    width: 40px; height: 40px;
                    background: #ffffff;
                    border: 2px solid #2563eb;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; color: #2563eb;
                    margin-bottom: 0.75rem;
                    box-shadow: 0 0 0 4px #ffffff;
                }
                .wiki-timeline-label {
                    font-size: 0.9rem; font-weight: 600; color: #1e293b;
                }
                
                /* Layout Columns */
                .wiki-columns { display: flex; gap: 2rem; margin-top: 2rem; }
                .wiki-col { flex: 1; }

                /* Lists */
                .wiki-list { list-style: none; padding: 0; margin: 0; }
                .wiki-list li {
                    position: relative;
                    padding-left: 2rem;
                    margin-bottom: 1rem;
                    color: #475569;
                    line-height: 1.6;
                }
                .wiki-list li::before {
                    content: '✓'; position: absolute; left: 0; top: 0; color: #10b981; font-weight: bold; background: #e1fbd8; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;
                }

                /* Alerts & Blocks */
                .wiki-alert-danger {
                    background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 1.25rem; margin-top: 1.5rem;
                }
                .wiki-alert-danger .title { color: #b91c1c; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;}
                
                .wiki-intro-block {
                    font-size: 1.1rem; color: #334155; line-height: 1.7; padding: 1.5rem;
                    background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px;
                    margin-bottom: 2rem;
                }

                /* Code Block */
                .wiki-code-block {
                    background: #0f172a; color: #f8fafc; padding: 1.5rem; border-radius: 8px; font-family: 'Consolas', monospace; font-size: 0.95rem; line-height: 1.6; overflow-x: auto;
                }

                /* Dashboard Analytics */
                .wiki-metrics { display: flex; gap: 1.5rem; margin-bottom: 2.5rem; }
                .wiki-metric-card { flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 1.5rem; text-align: center; }
                .wiki-metric-value { font-size: 2rem; font-weight: 700; color: #15803d; margin-bottom: 0.5rem; }
                .wiki-metric-label { color: #166534; font-weight: 600; font-size: 0.95rem; }

                /* Software Cards */
                .wiki-software-card {
                    background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
                }
                .wiki-software-header { display: flex; justify-content: space-between; align-items: center; }
                .wiki-software-title { font-size: 1.25rem; font-weight: 700; margin: 0; color: #0f172a; }
                .wiki-badge { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; }
                .wiki-badge-pro { background: #dcfce7; color: #166534; }
                .wiki-badge-con { background: #fee2e2; color: #b91c1c; }
                .wiki-software-features { display: flex; flex-direction: column; gap: 0.5rem; }
                .wiki-feature { display: flex; align-items: start; gap: 0.5rem; font-size: 0.9rem; }

                /* Accordion (from previous) */
                .wiki-accordion { margin-bottom: 2.5rem; }
                .wiki-accordion-item { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.75rem; overflow: hidden; background: #f8fafc; }
                .wiki-accordion-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: transparent; border: none; cursor: pointer; font-weight: 600; color: #334155; font-size: 1rem; text-align: left; transition: background-color 0.2s; }
                .wiki-accordion-header:hover { background-color: #f1f5f9; }
                .wiki-accordion-header-left { display: flex; align-items: center; gap: 1rem; }
                .wiki-dept-icon { width: 32px; height: 32px; background: #e0f2fe; color: #0284c7; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
                .wiki-accordion-icon { transition: transform 0.3s ease; color: #64748b; }
                .wiki-accordion-item.active .wiki-accordion-icon { transform: rotate(180deg); }
                .wiki-accordion-item.active .wiki-accordion-header { border-bottom: 1px solid #e2e8f0; }
                .wiki-accordion-content { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease-out; background: #ffffff; }
                .wiki-accordion-item.active .wiki-accordion-content { grid-template-rows: 1fr; }
                .wiki-accordion-content-inner { min-height: 0; overflow: hidden; padding: 0 1.5rem; opacity: 0; transition: opacity 0.3s ease, padding 0.3s ease; line-height: 1.6; }
                .wiki-accordion-item.active .wiki-accordion-content-inner { padding: 1.25rem 1.5rem 1.5rem 1.5rem; opacity: 1; color: #475569; }
                
                @media (max-width: 768px) {
                    .wiki-global-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .wiki-timeline { flex-direction: column; align-items: flex-start; gap: 1.5rem; margin-left: 20px;}
                    .wiki-timeline::before { left: 20px; top: 0; bottom: 0; width: 2px; height: auto; }
                    .wiki-timeline-step { width: 100%; flex-direction: row; gap: 1rem; text-align: left; }
                    .wiki-timeline-circle { margin-bottom: 0; }
                    .wiki-grid-2x2 { grid-template-columns: 1fr; }
                    .wiki-columns { flex-direction: column; }
                }
            </style>

            <div class="wiki-base">
                <!-- Global Header -->
                <div class="wiki-global-header">
                    <h1 class="wiki-global-title">Clear Code Wiki</h1>
                    <a href="./manual-corporativo_cc.pdf" download="Manual_Corporativo_Clear_Code.pdf" class="wiki-btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Descargar Manual Corporativo (PDF)
                    </a>
                </div>

                <!-- Navigation -->
                <nav class="wiki-nav">
                    <button class="wiki-tab active" data-target="wiki-tab-1">Manual de Bienvenida</button>
                    <button class="wiki-tab" data-target="wiki-tab-2">Políticas de la Empresa</button>
                    <button class="wiki-tab" data-target="wiki-tab-3">Doc Técnica y Proyectos</button>
                    <button class="wiki-tab" data-target="wiki-tab-4">Características Clave</button>
                    <button class="wiki-tab" data-target="wiki-tab-5">Recursos de Software</button>
                </nav>

                <div class="wiki-content">
                    
                    <!-- TAB 1: Manual de Bienvenida -->
                    <div id="wiki-tab-1" class="wiki-section">
                        <h2 class="wiki-title">Manual de Bienvenida</h2>
                        <div class="wiki-subtitle">Guía oficial de integración y cultura corporativa de Clear Code.</div>

                        <div class="wiki-intro-block">
                            <strong>Bienvenido a Clear Code.</strong> Este manual ha sido diseñado para acompañarte en tus primeros días, ayudarte a comprender cómo trabajamos y facilitarte una integración rápida, cómoda y clara en tu nuevo entorno de excelencia técnica.
                        </div>

                        <h3 class="wiki-h3">Nuestra Cultura</h3>
                        <div class="wiki-grid">
                            <div class="wiki-card">
                                <div class="wiki-card-header">
                                    <div class="wiki-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></div>
                                    <h4 class="wiki-card-title">Misión</h4>
                                </div>
                                <p class="wiki-card-text">Desarrollar soluciones tecnológicas innovadoras, eficientes y personalizadas bajo estrictos estándares de clean code.</p>
                            </div>
                            <div class="wiki-card">
                                <div class="wiki-card-header">
                                    <div class="wiki-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h4l3-9 5 18 3-9h5"></path></svg></div>
                                    <h4 class="wiki-card-title">Visión</h4>
                                </div>
                                <p class="wiki-card-text">Consolidarnos como una empresa líder internacional en ingeniería de software y escalabilidad extrema.</p>
                            </div>
                            <div class="wiki-card">
                                <div class="wiki-card-header">
                                    <div class="wiki-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
                                    <h4 class="wiki-card-title">Valores</h4>
                                </div>
                                <p class="wiki-card-text">Excelencia técnica, escalabilidad, transparencia total, y mejora continua basada en metodologías ágiles.</p>
                            </div>
                        </div>

                        <h3 class="wiki-h3">Estructura Departamental</h3>
                        <div class="wiki-accordion">
                            <!-- Documentación -->
                            <div class="wiki-accordion-item">
                                <button class="wiki-accordion-header">
                                    <div class="wiki-accordion-header-left">
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                                        Departamento de Documentación
                                    </div>
                                    <svg class="wiki-accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                <div class="wiki-accordion-content">
                                    <div class="wiki-accordion-content-inner">
                                        Este equipo se encarga de elaborar, mantener y actualizar toda la documentación técnica y funcional relacionada con nuestros proyectos. Su labor garantiza que los procesos, desarrollos y entregables cuenten con información clara, precisa y accesible, facilitando tanto el trabajo interno como la comprensión por parte de los clientes.
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Implementación -->
                            <div class="wiki-accordion-item">
                                <button class="wiki-accordion-header">
                                    <div class="wiki-accordion-header-left">
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg></div>
                                        Departamento de Implementación
                                    </div>
                                    <svg class="wiki-accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                <div class="wiki-accordion-content">
                                    <div class="wiki-accordion-content-inner">
                                        Responsable de llevar a cabo la puesta en marcha de las soluciones desarrolladas, este departamento trabaja directamente con los clientes para asegurar una integración correcta y eficiente de los sistemas. Su función incluye configuraciones, despliegues, pruebas en entorno real y acompañamiento durante las fases iniciales de uso.
                                    </div>
                                </div>
                            </div>

                            <!-- Investigación -->
                            <div class="wiki-accordion-item">
                                <button class="wiki-accordion-header">
                                    <div class="wiki-accordion-header-left">
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H15"></path><path d="M10 9H14"></path><path d="M3 19V21H21V19"></path><path d="M14 3v8l5 8v2H5v-2l5-8V3"></path></svg></div>
                                        Departamento de Investigación
                                    </div>
                                    <svg class="wiki-accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                <div class="wiki-accordion-content">
                                    <div class="wiki-accordion-content-inner">
                                        Dedicado a la exploración de nuevas tecnologías, metodologías y tendencias del sector, este departamento impulsa la innovación dentro de la empresa. Su objetivo es identificar oportunidades de mejora, evaluar herramientas emergentes y proponer soluciones que mantengan a la organización a la vanguardia del desarrollo tecnológico.
                                    </div>
                                </div>
                            </div>

                            <!-- RRHH y Redes Sociales -->
                            <div class="wiki-accordion-item">
                                <button class="wiki-accordion-header">
                                    <div class="wiki-accordion-header-left">
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                                        Departamento de Recursos Humanos y Redes Sociales (RRSS)
                                    </div>
                                    <svg class="wiki-accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                <div class="wiki-accordion-content">
                                    <div class="wiki-accordion-content-inner">
                                        Este departamento gestiona los procesos de selección, formación, bienestar y desarrollo profesional del equipo. Además, se encarga de la comunicación externa a través de redes sociales y otros canales corporativos, fortaleciendo la imagen de la empresa y promoviendo su cultura y valores.
                                    </div>
                                </div>
                            </div>

                            <!-- Desarrollo y Creatividad -->
                            <div class="wiki-accordion-item">
                                <button class="wiki-accordion-header">
                                    <div class="wiki-accordion-header-left">
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></div>
                                        Departamento de Desarrollo y Creatividad
                                    </div>
                                    <svg class="wiki-accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                <div class="wiki-accordion-content">
                                    <div class="wiki-accordion-content-inner">
                                        Es el núcleo técnico y creativo de la empresa. Aquí se diseñan, desarrollan y optimizan las soluciones de software que ofrecemos. El equipo combina conocimientos técnicos con pensamiento innovador para crear productos funcionales, escalables y alineados con las necesidades de los clientes. Su labor incluye programación, diseño de interfaces, arquitectura de software y generación de nuevas ideas que aporten valor.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: Políticas -->
                    <div id="wiki-tab-2" class="wiki-section" style="display: none;">
                        <h2 class="wiki-title">Políticas Corporativas</h2>
                        <div class="wiki-subtitle">Normativas y directrices operativas</div>

                        <div class="wiki-intro-block">
                            <strong>En Clear Code, la excelencia técnica exige un marco claro de actuación</strong> para garantizar la consistencia operativa y reforzar nuestra ventaja competitiva. Conoce nuestras políticas principales:
                        </div>

                        <div class="wiki-grid">
                            <!-- Tarjeta 1 -->
                            <div class="wiki-card">
                                <div class="wiki-card-header">
                                    <div class="wiki-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
                                    <h4 class="wiki-card-title">Vacaciones</h4>
                                </div>
                                <p class="wiki-card-text">Solicitud vía sistema interno con <strong>15 días de antelación</strong>. Sujeta a aprobación del responsable directo para asegurar la continuidad de los Sprints.</p>
                            </div>
                            
                            <!-- Tarjeta 2 -->
                            <div class="wiki-card">
                                <div class="wiki-card-header">
                                    <div class="wiki-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
                                    <h4 class="wiki-card-title">Gastos</h4>
                                </div>
                                <p class="wiki-card-text">Justificación obligatoria con tickets originales. Subida al sistema interno de ERP para su validación, revisión por finanzas y reembolso mensual.</p>
                            </div>

                            <!-- Tarjeta 3 -->
                            <div class="wiki-card">
                                <div class="wiki-card-header">
                                    <div class="wiki-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                                    <h4 class="wiki-card-title">Seguridad</h4>
                                </div>
                                <p class="wiki-card-text">Uso estricto de <strong>2FA (Autenticación de Dos Factores)</strong>. Prohibido compartir credenciales. Cierre de sesión en equipos compartidos y evitar redes Wi-Fi públicas no cifradas.</p>
                            </div>

                            <!-- Tarjeta 4 -->
                            <div class="wiki-card">
                                <div class="wiki-card-header">
                                    <div class="wiki-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                                    <h4 class="wiki-card-title">Plataforma</h4>
                                </div>
                                <p class="wiki-card-text">Uso exclusivo laboral de los equipos suministrados. Prohibido alterar datos sin autorización. Reporte inmediato de incidencias o vulnerabilidades a soporte IT.</p>
                            </div>

                            <!-- Tarjeta 5 -->
                            <div class="wiki-card">
                                <div class="wiki-card-header">
                                    <div class="wiki-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                                    <h4 class="wiki-card-title">Conducta</h4>
                                </div>
                                <p class="wiki-card-text">Fomento absoluto del respeto, puntualidad a las dailys, ética, honestidad y estricta confidencialidad de la información interna y código fuente.</p>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 3: Doc Técnica -->
                    <div id="wiki-tab-3" class="wiki-section" style="display: none;">
                        <h2 class="wiki-title">Documentación Técnica y de Proyectos</h2>
                        <div class="wiki-subtitle">Estándares y flujos operativos de desarrollo</div>

                        <h3 class="wiki-h3" style="margin-top:0;">Troubleshooting (Resolución de Problemas)</h3>
                        <div class="wiki-timeline">
                            <div class="wiki-timeline-step">
                                <div class="wiki-timeline-circle">1</div>
                                <div class="wiki-timeline-label">Verificación de red</div>
                            </div>
                            <div class="wiki-timeline-step">
                                <div class="wiki-timeline-circle">2</div>
                                <div class="wiki-timeline-label">Validación de identidad</div>
                            </div>
                            <div class="wiki-timeline-step">
                                <div class="wiki-timeline-circle">3</div>
                                <div class="wiki-timeline-label">Saneamiento (Caché)</div>
                            </div>
                            <div class="wiki-timeline-step">
                                <div class="wiki-timeline-circle">4</div>
                                <div class="wiki-timeline-label">Reinicio</div>
                            </div>
                            <div class="wiki-timeline-step">
                                <div class="wiki-timeline-circle">5</div>
                                <div class="wiki-timeline-label">Escalado a Nivel 2</div>
                            </div>
                        </div>

                        <div class="wiki-columns">
                            <div class="wiki-col">
                                <h3 class="wiki-h3">Ciclo de Vida (Agile & Git)</h3>
                                <div class="wiki-grid" style="grid-template-columns: 1fr; gap: 1rem; margin-bottom: 0;">
                                    <div class="wiki-card">
                                        <h4 class="wiki-card-title"><svg width="18" height="18" fill="none" stroke="#2563eb" stroke-width="2" style="margin-right:8px; vertical-align:middle;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Sprints</h4>
                                        <p class="wiki-card-text" style="margin-top:0.5rem;">Iteraciones de <strong>14 días</strong> orientadas a la entrega continua de valor. Todo PR requiere <i>Peer Review</i> obligatorio por al menos un Senior dev.</p>
                                    </div>
                                    <div class="wiki-card">
                                        <h4 class="wiki-card-title"><svg width="18" height="18" fill="none" stroke="#2563eb" stroke-width="2" style="margin-right:8px; vertical-align:middle;"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg> Repositorio</h4>
                                        <p class="wiki-card-text" style="margin-top:0.5rem;">Git centralizado. Rama <code>main</code> protegida para producción. Uso de ramas <code>feature/*</code> para desarrollo. <strong>Commits semánticos</strong> y claros requeridos.</p>
                                    </div>
                                </div>
                            </div>

                            <div class="wiki-col">
                                <h3 class="wiki-h3">Guía de Estilo y Conflictos</h3>
                                <ul class="wiki-list">
                                    <li><strong>Lenguaje Ejecutivo:</strong> Comunicación directa, cero tecnicismos inútiles con clientes, alta claridad y jerarquía visual.</li>
                                    <li><strong>Gestión de Conflictos:</strong> Práctica de la <strong>escucha activa</strong>, temple profesional y demostración de empatía ("Entiendo el impacto de este issue...").</li>
                                    <li><strong>Resolución Orientada:</strong> Presentación inmediata de propuestas de valor técnico y establecimiento de puntos de seguimiento cada 24h.</li>
                                </ul>

                                <div class="wiki-alert-danger">
                                    <div class="title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> POLICY WARNING</div>
                                    <p style="margin:0; color:#991b1b; font-size:0.95rem;">Aplicamos estricta Política de Privilegio Mínimo corporativo. El uso de Gestores de Contraseñas (1Password) es <strong>obligatorio</strong>. Backups automatizados diarios y cifrado in-transit/at-rest total.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 4: Dashboard Wiki -->
                    <div id="wiki-tab-4" class="wiki-section" style="display: none;">
                        <h2 class="wiki-title">Características Clave de la Wiki</h2>
                        <div class="wiki-subtitle">Visión analítica y estructura arquitectónica</div>

                        <div class="wiki-metrics">
                            <div class="wiki-metric-card">
                                <div class="wiki-metric-value">4 días</div>
                                <div class="wiki-metric-label">Reducción de MTTO (Antes: 2 semanas)</div>
                            </div>
                            <div class="wiki-metric-card">
                                <div class="wiki-metric-value">90 días</div>
                                <div class="wiki-metric-label">Auditorías Automáticas Regulares</div>
                            </div>
                        </div>

                        <h3 class="wiki-h3">Arquitectura SSOT (Single Source of Truth)</h3>
                        <p style="color:#475569; line-height:1.6; font-size:1.05rem;">La Wiki está diseñada arquitectónicamente como nuestra "Única Fuente de Verdad". Todo conocimiento no documentado aquí, estructuralmente no existe para la organización. Evitamos la duplicidad garantizando consistencia a nivel Enterprise.</p>

                        <div class="wiki-columns">
                            <div class="wiki-col">
                                <h3 class="wiki-h3" style="margin-top:0;">Los 4 Nodos Fundamentales</h3>
                                <div class="wiki-grid-2x2">
                                    <div class="wiki-card" style="padding: 1.25rem;">
                                        <div class="wiki-card-title">1. Engineering Hub</div>
                                        <p class="wiki-card-text">Arquitectura, APIs y CI/CD.</p>
                                    </div>
                                    <div class="wiki-card" style="padding: 1.25rem;">
                                        <div class="wiki-card-title">2. Product & Design</div>
                                        <p class="wiki-card-text">Figma, UX Specs y wireframes.</p>
                                    </div>
                                    <div class="wiki-card" style="padding: 1.25rem;">
                                        <div class="wiki-card-title">3. Operations & Culture</div>
                                        <p class="wiki-card-text">Onboarding, RRHH y directrices.</p>
                                    </div>
                                    <div class="wiki-card" style="padding: 1.25rem;">
                                        <div class="wiki-card-title">4. Sales & Growth</div>
                                        <p class="wiki-card-text">CRM, funnels y casos de uso.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="wiki-col">
                                <h3 class="wiki-h3" style="margin-top:0;">Jerarquía y Normativa Documental</h3>
                                <p style="color:#475569; margin-bottom: 1rem;">La documentación oficial exige el uso de tipografía <strong>Arial 12pt</strong> y una jerarquía decimal coherente mostrada a continuación:</p>
                                
                                <div class="wiki-code-block">
# Estructura de Documento [Draft]
1. Arquitectura Base
  1.1. Capa de Presentación
    1.1.1. Componentes Reutilizables
    1.1.2. Gestión de Estados (Redux/Context)
  1.2. Capa de Servicios
    1.2.1. Adaptadores REST
2. Despliegue Cloud
  2.1. Entorno de Staging
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 5: Software -->
                    <div id="wiki-tab-5" class="wiki-section" style="display: none;">
                        <h2 class="wiki-title">Recomendaciones de Software</h2>
                        <div class="wiki-subtitle">Stack de herramientas avalado corporativamente</div>

                        <div class="wiki-grid">
                            <!-- Trello -->
                            <div class="wiki-software-card">
                                <div class="wiki-software-header">
                                    <h3 class="wiki-software-title">Trello</h3>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="9"></rect><rect x="14" y="7" width="3" height="5"></rect></svg>
                                </div>
                                <p class="wiki-card-text">Herramienta visual de gestión de proyectos basada en tableros.</p>
                                <div class="wiki-software-features">
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-pro">Pro</span> Gestión visual intuitiva (Kanban), ideal para seguimiento de tareas rápidas, curva de aprendizaje nula.</div>
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-con">Contra</span> Limitado para proyectos de ingeniería muy complejos, pocas funcionalidades nativas de reporte avanzado.</div>
                                </div>
                            </div>

                            <!-- GitHub -->
                            <div class="wiki-software-card">
                                <div class="wiki-software-header">
                                    <h3 class="wiki-software-title">GitHub</h3>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                                </div>
                                <p class="wiki-card-text">Plataforma de desarrollo colaborativo y control de versiones distribuido.</p>
                                <div class="wiki-software-features">
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-pro">Pro</span> Estándar de la industria, potentes flujos de CI/CD (GitHub Actions), ecosistema inmenso de integraciones.</div>
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-con">Contra</span> Gestión de permisos compleja en organizaciones grandes, coste elevado en planes Enterprise.</div>
                                </div>
                            </div>

                            <!-- Tailscale -->
                            <div class="wiki-software-card">
                                <div class="wiki-software-header">
                                    <h3 class="wiki-software-title">Tailscale</h3>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                                </div>
                                <p class="wiki-card-text">VPN moderna y red mesh construida sobre el protocolo WireGuard.</p>
                                <div class="wiki-software-features">
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-pro">Pro</span> Configuración de VPN Zero-Config, red mesh segura para equipos remotos, gran facilidad de uso.</div>
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-con">Contra</span> Dependencia de un proveedor externo, puede presentar latencia en configuraciones muy específicas.</div>
                                </div>
                            </div>

                            <!-- Google Cloud -->
                            <div class="wiki-software-card">
                                <div class="wiki-software-header">
                                    <h3 class="wiki-software-title">Google Cloud (GCP)</h3>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>
                                </div>
                                <p class="wiki-card-text">Plataforma integral de servicios de computación en la nube pública.</p>
                                <div class="wiki-software-features">
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-pro">Pro</span> Infraestructura global de alto rendimiento, herramientas de Datos y AI líderes (BigQuery/VertexAI), escalabilidad masiva.</div>
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-con">Contra</span> Curva de aprendizaje técnica elevada, facturación compleja si no se monitoriza correctamente.</div>
                                </div>
                            </div>

                            <!-- Firebase -->
                            <div class="wiki-software-card">
                                <div class="wiki-software-header">
                                    <h3 class="wiki-software-title">Firebase</h3>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                                </div>
                                <p class="wiki-card-text">Plataforma de desarrollo en la nube para crear aplicaciones web y móviles.</p>
                                <div class="wiki-software-features">
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-pro">Pro</span> Desarrollo ultra rápido (Real-time DB), hosting y autenticación integrados, ideal para MVPs y apps móviles.</div>
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-con">Contra</span> Riesgo de "vendor lock-in", los costes pueden escalar muy rápido con un volumen de datos alto.</div>
                                </div>
                            </div>

                            <!-- Antigravity -->
                            <div class="wiki-software-card">
                                <div class="wiki-software-header">
                                    <h3 class="wiki-software-title">Antigravity (IA Assistant)</h3>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                </div>
                                <p class="wiki-card-text">Asistente de inteligencia artificial avanzado para desarrolladores.</p>
                                <div class="wiki-software-features">
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-pro">Pro</span> Aceleración drástica del desarrollo frontend, generación de código limpio y profesional, soporte en tiempo real.</div>
                                    <div class="wiki-feature"><span class="wiki-badge wiki-badge-con">Contra</span> Requiere supervisión humana constante, dependiente de la claridad de los prompts de entrada.</div>
                                </div>
                            </div>
                        </div>
                        
                        <hr style="margin: 3rem 0; border: 1px solid #e2e8f0;">
                        <h3 class="wiki-h3" style="margin-top:0;">Editor Colaborativo</h3>
                        <div class="wiki-intro-block" style="background-color: #f0fdf4; border-left-color: #10b981;">
                            Usa este editor para redactar nuevas políticas. El contenido usa <strong>Quill.js</strong> para edición enriquecida.
                        </div>
                        
                        <div id="editor-wiki" style="height: 250px; background: white; margin-bottom: 20px; border-radius: 0 0 8px 8px;">
                            <p>Escribe el contenido técnico aquí (usa tipografía Arial)...</p>
                        </div>
                        <button class="wiki-btn-primary" style="margin-bottom: 3rem;">Guardar en Base de Datos</button>

                        <h3 class="wiki-h3">Directorio de Documentos Oficiales</h3>
                        <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <table id="tabla-documentos" class="display" style="width:100%; text-align: left;">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Documento</th>
                                        <th>Departamento</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>1.1</td>
                                        <td>Manual de Bienvenida</td>
                                        <td>Operations</td>
                                        <td><span class="wiki-badge wiki-badge-pro">Vigente</span></td>
                                    </tr>
                                    <tr>
                                        <td>2.1</td>
                                        <td>Protocolo de Seguridad</td>
                                        <td>Engineering</td>
                                        <td><span class="wiki-badge wiki-badge-con">Revisión</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        `;

        this.attachEvents(container);
    }

    attachEvents(container) {
        const tabs = container.querySelectorAll('.wiki-tab');
        const sections = container.querySelectorAll('.wiki-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from tabs
                tabs.forEach(t => t.classList.remove('active'));

                // Hide and reset animation for all sections
                sections.forEach(s => {
                    s.style.display = 'none';
                    s.style.animation = 'none';
                    s.offsetHeight; /* trigger reflow */
                    s.style.animation = null;
                });

                // Set active tab and show section
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                const targetSection = container.querySelector('#' + targetId);

                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            });
        });

        // Accordion functionality
        const accordionHeaders = container.querySelectorAll('.wiki-accordion-header');

        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;

                // Close others
                const allItems = container.querySelectorAll('.wiki-accordion-item');
                allItems.forEach(i => {
                    if (i !== item && i.classList.contains('active')) {
                        i.classList.remove('active');
                    }
                });

                // Toggle click
                item.classList.toggle('active');
            });
        });

        // --- ACTIVACIÓN DE PLUGINS DE TERCEROS ---
        setTimeout(() => {
            // 1. Activar Quill.js (Editor)
            if (container.querySelector('#editor-wiki')) {
                new Quill('#editor-wiki', {
                    theme: 'snow',
                    placeholder: 'Escribe el contenido técnico aquí...'
                });
            }

            // 2. Activar DataTables (Tablas Inteligentes)
            if (container.querySelector('#tabla-documentos')) {
                if (window.$ && $.fn.DataTable) {
                    if ($.fn.DataTable.isDataTable('#tabla-documentos')) {
                        $('#tabla-documentos').DataTable().destroy();
                    }
                    $('#tabla-documentos').DataTable({
                        "language": {
                            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
                        },
                        "pageLength": 5,
                        "lengthMenu": [5, 10, 25]
                    });
                }
            }
        }, 100);
    }
}
