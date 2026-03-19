export class WikiController {
    constructor(app) {
        this.app = app;
    }

    async renderWiki(container) {
        container.innerHTML = `
            <div class="wiki-container">
                <div class="wiki-nav" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; overflow-x: auto;">
                    <button class="wiki-tab active" data-target="wiki-tab-1" style="background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; border-bottom: 2px solid #2563eb; color: #2563eb; font-weight: bold; white-space: nowrap;">Manuales de bienvenida</button>
                    <button class="wiki-tab" data-target="wiki-tab-2" style="background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; color: #4b5563; white-space: nowrap;">Políticas de la Empresa</button>
                    <button class="wiki-tab" data-target="wiki-tab-3" style="background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; color: #4b5563; white-space: nowrap;">Documentación Técnica y de Proyectos</button>
                    <button class="wiki-tab" data-target="wiki-tab-4" style="background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; color: #4b5563; white-space: nowrap;">Características Clave de la Wiki</button>
                    <button class="wiki-tab" data-target="wiki-tab-5" style="background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; color: #4b5563; white-space: nowrap;">Recomendaciones de Software</button>
                </div>

                <div class="wiki-content" style="background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div id="wiki-tab-1" class="wiki-section">
                        <h2 style="margin-top: 0; color: #111827;">Manuales de Bienvenida (Onboarding)</h2>
                        <p style="color: #4b5563; font-style: italic;"><strong>Autor:</strong> elaborado por: Dario Acosta Sanchez</p>
                        <p style="color: #374151;"><strong>Introducción:</strong> Bienvenido a nuestra empresa. Este manual ha sido diseñado para acompañarte en tus primeros días, ayudarte a comprender cómo trabajamos y facilitarte una integración rápida, cómoda y clara en tu nuevo entorno.</p>
                        
                        <h3 style="color: #1f2937; margin-top: 1.5rem;">Misión, Visión y Valores:</h3>
                        <ul style="color: #374151; line-height: 1.6;">
                            <li><strong>Misión:</strong> Nuestra misión es desarrollar soluciones tecnológicas innovadoras, eficientes y personalizadas.</li>
                            <li><strong>Visión:</strong> Aspiramos a consolidarnos como una empresa líder en el desarrollo de software a nivel internacional.</li>
                            <li><strong>Valores:</strong> Innovación, Calidad, Compromiso, Transparencia, Trabajo en equipo y Orientación al cliente.</li>
                        </ul>

                        <h3 style="color: #1f2937; margin-top: 1.5rem;">Estructura Departamental:</h3>
                        <ul style="color: #374151; line-height: 1.6;">
                            <li>Departamento de Documentación.</li>
                            <li>Departamento de Implementación.</li>
                            <li>Departamento de Investigación.</li>
                            <li>Departamento de Recursos Humanos y Redes Sociales (RRSS).</li>
                            <li>Departamento de Desarrollo y Creatividad.</li>
                        </ul>
                        <ul style="color: #374151; line-height: 1.6; margin-top: 1rem;">
                            <li><strong>Canales de Comunicación Interna:</strong> Utilizamos la Comunidad de WhatsApp para comunicaciones rápidas y un Servidor de Discord para la colaboración estructurada. Toda interacción entre departamentos está supervisada por la Dirección General o por los jefes de cada departamento.</li>
                            <li><strong>Metodología de Trabajo:</strong> Aplicamos una metodología de trabajo basada en Scrum con Sprints de 14 días.</li>
                        </ul>
                    </div>

                    <div id="wiki-tab-2" class="wiki-section" style="display: none;">
                        <h2 style="margin-top: 0; color: #111827;">Políticas de la Empresa</h2>
                        <p></p>
                    </div>

                    <div id="wiki-tab-3" class="wiki-section" style="display: none;">
                        <h2 style="margin-top: 0; color: #111827;">Documentación Técnica y de Proyectos</h2>
                        <p></p>
                    </div>

                    <div id="wiki-tab-4" class="wiki-section" style="display: none;">
                        <h2 style="margin-top: 0; color: #111827;">Características Clave de la Wiki</h2>
                        <p></p>
                    </div>

                    <div id="wiki-tab-5" class="wiki-section" style="display: none;">
                        <h2 style="margin-top: 0; color: #111827;">Recomendaciones de Software</h2>
                        <p></p>
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
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.borderBottomColor = 'transparent';
                    t.style.color = '#4b5563';
                    t.style.fontWeight = 'normal';
                });
                sections.forEach(s => s.style.display = 'none');

                const targetId = tab.getAttribute('data-target');
                const targetSection = container.querySelector('#' + targetId);

                tab.classList.add('active');
                tab.style.borderBottomColor = '#2563eb';
                tab.style.color = '#2563eb';
                tab.style.fontWeight = 'bold';

                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            });
        });
    }
}
