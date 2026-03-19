export class WikiController {
    constructor(app) {
        this.app = app;
    }

    async renderWiki(container) {
        container.innerHTML = `
            <style>
                .wiki-base {
                    font-family: 'Open Sans', system-ui, sans-serif;
                    background-color: transparent;
                    color: #1e293b;
                    padding: 0 1rem 2rem 1rem;
                }
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
                    font-weight: 500;
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
                    font-weight: 600;
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
                .wiki-content {
                    background: #ffffff;
                    padding: 2.5rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
                    min-height: 500px;
                }
                .wiki-section {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .wiki-header {
                    margin-bottom: 2.5rem;
                }
                .wiki-title {
                    margin-top: 0;
                    color: #0f172a;
                    font-size: 2rem;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                }
                .wiki-author {
                    color: #64748b;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                    font-style: italic;
                }
                .wiki-btn-download {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background-color: #0f172a;
                    color: #ffffff;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.95rem;
                    margin-bottom: 2rem;
                    transition: background-color 0.2s, transform 0.1s;
                    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.2);
                }
                .wiki-btn-download:hover {
                    background-color: #1e293b;
                    transform: translateY(-1px);
                }
                .wiki-intro {
                    font-size: 1.1rem;
                    color: #334155;
                    line-height: 1.7;
                    padding: 1.5rem;
                    background-color: #f8fafc;
                    border-left: 4px solid #3b82f6;
                    border-radius: 0 8px 8px 0;
                    margin-bottom: 2.5rem;
                }
                .wiki-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                .wiki-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    transition: box-shadow 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .wiki-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
                }
                .wiki-card-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .wiki-card-text {
                    color: #475569;
                    line-height: 1.6;
                    font-size: 0.95rem;
                }
                .wiki-h3 {
                    color: #0f172a;
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 0.5rem;
                }
                .wiki-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .wiki-list li {
                    position: relative;
                    padding-left: 2rem;
                    margin-bottom: 1rem;
                    color: #475569;
                    line-height: 1.6;
                }
                .wiki-list li::before {
                    content: '✓';
                    position: absolute;
                    left: 0;
                    top: 0;
                    color: #10b981;
                    font-weight: bold;
                    background: #e1fbd8;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                }
                .wiki-accordion {
                    margin-bottom: 2.5rem;
                }
                .wiki-accordion-item {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    margin-bottom: 0.75rem;
                    overflow: hidden;
                    background: #f8fafc;
                }
                .wiki-accordion-header {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    color: #334155;
                    font-size: 1rem;
                    font-family: inherit;
                    text-align: left;
                    transition: background-color 0.2s;
                }
                .wiki-accordion-header:hover {
                    background-color: #f1f5f9;
                }
                .wiki-accordion-header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .wiki-dept-icon {
                    width: 32px;
                    height: 32px;
                    background: #e0f2fe;
                    color: #0284c7;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .wiki-accordion-icon {
                    transition: transform 0.3s ease;
                    color: #64748b;
                }
                .wiki-accordion-item.active .wiki-accordion-icon {
                    transform: rotate(180deg);
                }
                .wiki-accordion-item.active .wiki-accordion-header {
                    border-bottom: 1px solid #e2e8f0;
                }
                .wiki-accordion-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                    background: #ffffff;
                }
                .wiki-accordion-content-inner {
                    padding: 0 1.5rem;
                    opacity: 0;
                    transition: opacity 0.3s ease, padding 0.3s ease;
                    line-height: 1.6;
                }
                .wiki-accordion-item.active .wiki-accordion-content-inner {
                    padding: 1.25rem 1.5rem;
                    opacity: 1;
                    color: #475569;
                }
                .wiki-callout {
                    margin-top: 2.5rem;
                    padding: 1.25rem;
                    background-color: #fffbeb;
                    border-left: 4px solid #f59e0b;
                    border-radius: 0 8px 8px 0;
                }
                .wiki-callout-title {
                    font-weight: 600;
                    color: #b45309;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .wiki-callout-text {
                    color: #92400e;
                    font-size: 0.95rem;
                }
                .wiki-placeholder {
                    color: #94a3b8;
                    font-style: italic;
                    line-height: 1.6;
                }
                .wiki-flex-row {
                    display: flex;
                    gap: 1.5rem;
                    flex-wrap: wrap;
                }
                .wiki-flex-col {
                    flex: 1;
                    min-width: 250px;
                }
            </style>

            <div class="wiki-base">
                <nav class="wiki-nav">
                    <button class="wiki-tab active" data-target="wiki-tab-1">Manuales de Bienvenida</button>
                    <button class="wiki-tab" data-target="wiki-tab-2">Políticas de la Empresa</button>
                    <button class="wiki-tab" data-target="wiki-tab-3">Doc Técnica y Proyectos</button>
                    <button class="wiki-tab" data-target="wiki-tab-4">Características de Wiki</button>
                    <button class="wiki-tab" data-target="wiki-tab-5">Recursos de Software</button>
                </nav>

                <div class="wiki-content">
                    <!-- TAB 1: Manuales de Bienvenida -->
                    <div id="wiki-tab-1" class="wiki-section">
                        <header class="wiki-header">
                            <h2 class="wiki-title">Manuales de Bienvenida (Onboarding)</h2>
                            <div class="wiki-author">Elaborado por: Dario Acosta Sanchez</div>
                        </header>

                        <a href="./manual-bienvenida.pdf" download="manual-bienvenida.pdf" class="wiki-btn-download">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Descargar Manual Completo (PDF)
                        </a>

                        <div class="wiki-intro">
                            <strong>Bienvenido a nuestra empresa.</strong> Este manual ha sido diseñado para acompañarte en tus primeros días, ayudarte a comprender cómo trabajamos y facilitarte una integración rápida, cómoda y clara en tu nuevo entorno.
                        </div>

                        <h3 class="wiki-h3">Misión, Visión y Valores</h3>
                        <div class="wiki-grid">
                            <div class="wiki-card">
                                <div class="wiki-card-title">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                                    Misión
                                </div>
                                <div class="wiki-card-text">Desarrollar soluciones tecnológicas innovadoras, eficientes y personalizadas.</div>
                            </div>
                            <div class="wiki-card">
                                <div class="wiki-card-title">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M2 12h4l3-9 5 18 3-9h5"></path></svg>
                                    Visión
                                </div>
                                <div class="wiki-card-text">Consolidarnos como una empresa líder en el desarrollo de software a nivel internacional.</div>
                            </div>
                            <div class="wiki-card">
                                <div class="wiki-card-title">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    Valores
                                </div>
                                <div class="wiki-card-text">Innovación, Calidad, Compromiso, Transparencia, Trabajo en equipo y Orientación al cliente.</div>
                            </div>
                        </div>

                        <h3 class="wiki-h3">Estructura Departamental</h3>
                        <div class="wiki-accordion">
                            <!-- Documentación -->
                            <div class="wiki-accordion-item">
                                <button class="wiki-accordion-header">
                                    <div class="wiki-accordion-header-left">
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
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
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></div>
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
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
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

                            <!-- RRSS -->
                            <div class="wiki-accordion-item">
                                <button class="wiki-accordion-header">
                                    <div class="wiki-accordion-header-left">
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
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

                            <!-- Creatividad -->
                            <div class="wiki-accordion-item">
                                <button class="wiki-accordion-header">
                                    <div class="wiki-accordion-header-left">
                                        <div class="wiki-dept-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
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

                        <div class="wiki-flex-row">
                            <div class="wiki-flex-col">
                                <h3 class="wiki-h3" style="margin-top: 0;">Comunicación</h3>
                                <div class="wiki-card">
                                    <p class="wiki-card-text" style="margin: 0;">Utilizamos la <strong>Comunidad de WhatsApp</strong> para comunicaciones rápidas y avisos inmediatos, mientras que disponemos de un <strong>Servidor de Discord</strong> estructurado para la colaboración diaria y el seguimiento continuo en equipo.</p>
                                </div>
                            </div>
                            <div class="wiki-flex-col">
                                <h3 class="wiki-h3" style="margin-top: 0;">Metodología de Trabajo</h3>
                                <div class="wiki-card">
                                    <p class="wiki-card-text" style="margin: 0;">Aplicamos un marco de trabajo ágil basado en <strong>Scrum</strong>. Desarrollamos nuestro producto mediante <strong>Sprints de 14 días</strong> de duración para asegurar entregas periódicas de valor.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: Políticas de la Empresa -->
                    <div id="wiki-tab-2" class="wiki-section" style="display: none;">
                        <h2 class="wiki-title">Políticas de la Empresa</h2>
                        <p class="wiki-placeholder">Bienvenido a la sección de Políticas. Aquí encontrarás toda la normativa interna, protocolos operativos, códigos de conducta y beneficios corporativos...</p>
                        
                        <ul class="wiki-list" style="margin-top: 1.5rem;">
                            <li>[Ejemplo] Horarios, modalidades de teletrabajo y políticas de compensación.</li>
                            <li>[Ejemplo] Lineamientos éticos y procedimientos de seguridad interna.</li>
                            <li>[Ejemplo] Normativas relativas al uso adecuado del equipamiento de TI.</li>
                        </ul>

                        <div class="wiki-callout">
                            <div class="wiki-callout-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                Información Importante
                            </div>
                            <div class="wiki-callout-text">Las políticas se actualizan anualmente. Recomendamos revisarlas periódicamente para mantenerse al día con los cambios.</div>
                        </div>
                    </div>

                    <!-- TAB 3: Documentación Técnica -->
                    <div id="wiki-tab-3" class="wiki-section" style="display: none;">
                        <h2 class="wiki-title">Documentación Técnica y de Proyectos</h2>
                        <p class="wiki-placeholder">En este espacio se resguarda el conocimiento técnico: desde diagramas de arquitectura en la nube hasta convenciones de estilo de código...</p>
                        
                        <ul class="wiki-list" style="margin-top: 1.5rem;">
                            <li>[Ejemplo] Guía de buenas prácticas y estándares de codificación (Linting, Formatting).</li>
                            <li>[Ejemplo] Arquitectura de base de datos, procedimientos de backup y migraciones.</li>
                            <li>[Ejemplo] Manual de despliegues (CI/CD) para entornos de Staging y Producción.</li>
                        </ul>

                        <div class="wiki-callout">
                            <div class="wiki-callout-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                Nota para Desarrolladores
                            </div>
                            <div class="wiki-callout-text">Antes de modificar infraestructura o variables de entorno, asegúrese de elevar la solicitud adecuada a DevOps o Jefatura Técnica.</div>
                        </div>
                    </div>

                    <!-- TAB 4: Características Clave de la Wiki -->
                    <div id="wiki-tab-4" class="wiki-section" style="display: none;">
                        <h2 class="wiki-title">Características Clave de la Wiki</h2>
                        <p class="wiki-placeholder">Conoce cómo aprovechar al máximo nuestra plataforma Wiki para documentar y colaborar de forma eficaz con tu equipo...</p>
                        
                        <ul class="wiki-list" style="margin-top: 1.5rem;">
                            <li>[Ejemplo] Motor de búsqueda avanzado y clasificación de artículos por etiquetas (tags).</li>
                            <li>[Ejemplo] Trazabilidad y control de historial de versiones para evitar pérdida de datos.</li>
                            <li>[Ejemplo] Permisos granulares y niveles de acceso según el rol en la organización.</li>
                        </ul>

                        <div class="wiki-callout">
                            <div class="wiki-callout-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                Tip de Productividad
                            </div>
                            <div class="wiki-callout-text">Usa atajos de teclado para una navegación mucho más rápida y mantén organizados tus manuales principales en "Favoritos".</div>
                        </div>
                    </div>

                    <!-- TAB 5: Recomendaciones de Software -->
                    <div id="wiki-tab-5" class="wiki-section" style="display: none;">
                        <h2 class="wiki-title">Recomendaciones de Software</h2>
                        <p class="wiki-placeholder">Un compendio oficial de las herramientas y servicios digitales aprobados e impulsados por la empresa para garantizar la eficiencia y seguridad...</p>
                        
                        <ul class="wiki-list" style="margin-top: 1.5rem;">
                            <li>[Ejemplo] IDEs recomendados (IntelliJ IDEA, VS Code) y extensiones básicas.</li>
                            <li>[Ejemplo] Gestor de contraseñas corporativo y cliente VPN autorizado.</li>
                            <li>[Ejemplo] Herramientas homologadas para diagramación (Figma, Miro, draw.io).</li>
                        </ul>

                        <div class="wiki-callout">
                            <div class="wiki-callout-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                Aprobación de Licencias
                            </div>
                            <div class="wiki-callout-text">El software de pago requiere aprobación explícita de tu superior directo antes de poder emitirse una orden de compra o licenciamiento.</div>
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
                tabs.forEach(t => t.classList.remove('active'));
                
                sections.forEach(s => {
                    s.style.display = 'none';
                    // Pequeño hack para forzar el reflow y reiniciar la animación CSS
                    s.style.animation = 'none';
                    s.offsetHeight;
                    s.style.animation = null; 
                });

                tab.classList.add('active');

                const targetId = tab.getAttribute('data-target');
                const targetSection = container.querySelector('#' + targetId);

                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            });
        });

        // Eventos del Acordeón
        const accordionHeaders = container.querySelectorAll('.wiki-accordion-header');
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;
                const content = item.querySelector('.wiki-accordion-content');
                
                // Cierra los otros acordeones (comportamiento habitual)
                const allItems = container.querySelectorAll('.wiki-accordion-item');
                allItems.forEach(i => {
                    if (i !== item && i.classList.contains('active')) {
                        i.classList.remove('active');
                        const iContent = i.querySelector('.wiki-accordion-content');
                        iContent.style.maxHeight = null;
                    }
                });

                // Alterna el acordeón clickeado
                item.classList.toggle('active');
                
                if (item.classList.contains('active')) {
                    content.style.maxHeight = content.scrollHeight + "px";
                } else {
                    content.style.maxHeight = null;
                }
            });
        });
    }
}
