export class WikiController {
    constructor(app) {
        this.app = app;
    }

    async renderWiki(container) {
        container.innerHTML = `
            <style>
                .wiki-base {
                    font-family: 'Inter', system-ui, sans-serif;
                    background-color: #f8fafc;
                    color: #0f172a;
                    padding: 2rem 1rem 4rem 1rem;
                    min-height: calc(100vh - 100px);
                }
                
                /* Container */
                .wiki-container {
                    max-width: 1000px;
                    margin: 0 auto;
                }

                /* Hero Section */
                .wiki-hero {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 4rem 3rem;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    margin-bottom: 3rem;
                    position: relative;
                    overflow: hidden;
                }
                
                /* Decorative gradients for Hero */
                .wiki-hero::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 6px;
                    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
                }

                .wiki-hero-badge {
                    display: inline-block;
                    background: #eff6ff;
                    color: #2563eb;
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: 0.35rem 1rem;
                    border-radius: 9999px;
                    margin-bottom: 1.5rem;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                .wiki-hero-title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                    margin: 0 0 1.5rem 0;
                    color: #0f172a;
                    line-height: 1.1;
                }
                
                .wiki-hero-title span {
                    background: linear-gradient(90deg, #2563eb, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .wiki-hero-subtitle {
                    font-size: 1.25rem;
                    color: #475569;
                    line-height: 1.7;
                    max-width: 800px;
                    margin: 0 auto 3rem auto;
                }

                /* Buttons */
                .wiki-btn-group {
                    display: flex;
                    justify-content: center;
                    gap: 1.25rem;
                    flex-wrap: wrap;
                }

                .wiki-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 1.05rem;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    border: none;
                }

                .wiki-btn-primary {
                    background-color: #0f172a;
                    color: #ffffff;
                    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2);
                }

                .wiki-btn-primary:hover {
                    background-color: #1e293b;
                    transform: translateY(-2px);
                    box-shadow: 0 15px 20px -3px rgba(15, 23, 42, 0.3);
                }

                .wiki-btn-secondary {
                    background-color: #ffffff;
                    color: #0f172a;
                    border: 2px solid #e2e8f0;
                }

                .wiki-btn-secondary:hover {
                    border-color: #cbd5e1;
                    background-color: #f8fafc;
                    transform: translateY(-2px);
                }

                /* Notepad Section */
                .wiki-notepad {
                    background: #ffffff;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    padding: 2.5rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                }

                .wiki-notepad-header {
                    margin-bottom: 2.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .wiki-notepad-icon {
                    width: 56px;
                    height: 56px;
                    background: #eff6ff;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #3b82f6;
                    flex-shrink: 0;
                }

                .wiki-notepad-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0 0 0.5rem 0;
                    color: #0f172a;
                    letter-spacing: -0.01em;
                }

                .wiki-notepad-desc {
                    color: #64748b;
                    margin: 0;
                    line-height: 1.6;
                    font-size: 1.05rem;
                }

                /* Editor Styling Override */
                #editor-wiki {
                    min-height: 350px;
                    border-radius: 0 0 12px 12px;
                    border-color: #e2e8f0;
                    font-size: 1.1rem;
                    color: #334155;
                }
                .ql-toolbar.ql-snow {
                    border-color: #e2e8f0;
                    border-radius: 12px 12px 0 0;
                    background: #f8fafc;
                    padding: 1rem;
                }
                
                .ql-container.ql-snow {
                    border-color: #e2e8f0;
                }

                .wiki-action-bar {
                    margin-top: 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                }

                @media (max-width: 768px) {
                    .wiki-hero { padding: 3rem 1.5rem; }
                    .wiki-hero-title { font-size: 2.5rem; }
                    .wiki-btn-group { flex-direction: column; }
                    .wiki-btn { width: 100%; justify-content: center; }
                    .wiki-notepad { padding: 1.5rem; }
                    .wiki-notepad-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                }
            </style>

            <div class="wiki-base">
                <div class="wiki-container">
                    
                    <!-- Hero Section -->
                    <div class="wiki-hero">
                        <span class="wiki-hero-badge">Single Source of Truth</span>
                        <h1 class="wiki-hero-title">Portal de Conocimiento<br><span>Clear Code</span></h1>
                        <p class="wiki-hero-subtitle">
                            Acceso centralizado a nuestra Wiki oficial. Toda la documentación, normativas y arquitectura de software se gestionan en tiempo real en nuestro servidor seguro.
                        </p>
                        
                        <div class="wiki-btn-group">
                            <a href="http://10.0.0.1/dokuwiki/doku.php?id=start" target="_blank" class="wiki-btn wiki-btn-primary">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                                Abrir DokuWiki (Intranet Completa)
                            </a>
                            <a href="./manual-corporativo_cc.pdf" download="Manual_Corporativo_Clear_Code.pdf" class="wiki-btn wiki-btn-secondary">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Descargar Manual Corporativo (PDF)
                            </a>
                        </div>
                    </div>

                    <!-- Notepad Section -->
                    <div class="wiki-notepad">
                        <div class="wiki-notepad-header">
                            <div class="wiki-notepad-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 class="wiki-notepad-title">Bloc de Notas / Borrador Rápido</h2>
                                <p class="wiki-notepad-desc">Utiliza este entorno enriquecido para redactar y maquetar tus ideas con formato antes de transferirlas a la Wiki oficial.</p>
                            </div>
                        </div>

                        <div id="editor-wiki"></div>
                        
                        <div class="wiki-action-bar">
                            <button id="btn-copy-quill" class="wiki-btn wiki-btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.95rem; justify-content: center; min-width: 220px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copiar al portapapeles
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        `;

        this.attachEvents(container);
    }

    attachEvents(container) {
        // --- ACTIVACIÓN DE PLUGINS DE TERCEROS ---
        setTimeout(() => {
            // 1. Activar Quill.js (Editor)
            if (container.querySelector('#editor-wiki')) {
                const quillInstance = new Quill('#editor-wiki', {
                    theme: 'snow',
                    placeholder: 'Escribe el contenido técnico aquí...'
                });

                const btnCopy = container.querySelector('#btn-copy-quill');
                if (btnCopy) {
                    btnCopy.addEventListener('click', () => {
                        const text = quillInstance.getText();

                        // Fallback implementation to handle cases where navigator.clipboard is unavailable
                        const copyFallback = (textToCopy) => {
                            const textArea = document.createElement("textarea");
                            textArea.value = textToCopy;
                            textArea.style.position = "absolute";
                            textArea.style.left = "-999999px";
                            document.body.appendChild(textArea);
                            textArea.select();
                            try {
                                document.execCommand('copy');
                                showCopiedFeedback(btnCopy);
                            } catch (error) {
                                console.error("Error fallback clipboard: ", error);
                            } finally {
                                textArea.remove();
                            }
                        };

                        const showCopiedFeedback = (button) => {
                            const originalHtml = button.innerHTML;
                            button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ¡Copiado!';
                            button.style.backgroundColor = '#10b981'; // Green
                            setTimeout(() => {
                                button.innerHTML = originalHtml;
                                button.style.backgroundColor = ''; // Restore original
                            }, 2000);
                        };

                        if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(text).then(() => {
                                showCopiedFeedback(btnCopy);
                            }).catch(err => {
                                console.error('Error al usar clipboard API. Usando fallback', err);
                                copyFallback(text);
                            });
                        } else {
                            copyFallback(text);
                        }
                    });
                }
            }
        }, 100);
    }
}
