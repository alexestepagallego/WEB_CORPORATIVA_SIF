export class DriveController {
    constructor(app) {
        this.app = app;
        this.currentPath = [{ id: 'root', name: 'Inicio' }];
    }

    async renderDrive(container, headerActions) {
        const currentFolder = this.currentPath[this.currentPath.length - 1];
        
        if (headerActions) {
            headerActions.innerHTML = '';
        }

        // Renderizamos la interfaz con los botones
        container.innerHTML = `
            <div class="drive-container" style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
                    <div class="drive-breadcrumbs" style="font-size: 1.2rem; font-weight: 600; color: var(--text-color);">
                        ${this.currentPath.map((folder, index) => `
                            <span class="breadcrumb-item" data-index="${index}" style="cursor: pointer; color: ${index === this.currentPath.length - 1 ? 'var(--text-color)' : 'var(--primary-color)'};">
                                ${folder.name}
                            </span>
                            ${index < this.currentPath.length - 1 ? ' <span style="color: #ccc; margin: 0 8px;">/</span> ' : ''}
                        `).join('')}
                    </div>
                    
                    <div class="drive-toolbar" style="display: flex; gap: 12px;">
                        <button id="btn-new-folder" class="btn" style="background-color: var(--secondary-color); color: white; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.95rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s;">
                            📁 Nueva Carpeta
                        </button>
                        <button id="btn-add-link" class="btn" style="background-color: var(--primary-color); color: white; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.95rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s;">
                            🔗 Añadir Recurso
                        </button>
                    </div>
                </div>

                <div id="drive-items-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                    <div style="text-align: center; grid-column: 1 / -1; color: var(--text-light); padding: 40px;">Cargando contenido...</div>
                </div>
            </div>
        `;

        // Añadimos los eventos a las migas de pan
        container.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (index < this.currentPath.length - 1) {
                    this.currentPath = this.currentPath.slice(0, index + 1);
                    this.renderDrive(container, headerActions);
                }
            });
        });

        // Forma SEGURA de añadir los eventos a los botones (evita fallos de carga rápida)
        const btnNewFolder = container.querySelector('#btn-new-folder');
        const btnAddLink = container.querySelector('#btn-add-link');

        if (btnNewFolder) {
            btnNewFolder.addEventListener('click', () => this.handleNewFolder(container, headerActions));
        }
        if (btnAddLink) {
            btnAddLink.addEventListener('click', () => this.handleAddLink(container, headerActions));
        }

        // Cargamos los archivos de la base de datos
        await this.loadItems(currentFolder.id);
    }

    async loadItems(parentId) {
        const grid = document.getElementById('drive-items-grid');
        if (!grid) return;

        try {
            const items = await this.app.db.getDriveItemsByParent(parentId);
            
            if (items.length === 0) {
                grid.innerHTML = `<div style="text-align: center; grid-column: 1 / -1; color: var(--text-light); padding: 40px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #ddd;">Esta carpeta está vacía.<br><br>Haz clic en <b>"Añadir Recurso"</b> arriba a la derecha para empezar.</div>`;
                return;
            }

            const folders = items.filter(i => i.type === 'folder');
            const links = items.filter(i => i.type === 'link');

            grid.innerHTML = [...folders, ...links].map(item => `
                <div class="drive-item" data-id="${item.id}" data-type="${item.type}" data-name="${item.name}" data-url="${item.url || ''}" style="background: white; border-radius: 10px; padding: 20px 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid var(--border-color); transition: all 0.2s ease;">
                    ${item.type === 'folder' 
                        ? `<svg width="54" height="54" viewBox="0 0 24 24" fill="var(--primary-light)" stroke="var(--primary-color)" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
                        : `<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--secondary-color);"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`
                    }
                    <span style="margin-top: 15px; font-weight: 600; font-size: 0.95rem; word-break: break-word; line-height: 1.3;">${item.name}</span>
                </div>
            `).join('');

            grid.querySelectorAll('.drive-item').forEach(el => {
                el.addEventListener('mouseenter', () => { el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)'; });
                el.addEventListener('mouseleave', () => { el.style.transform = ''; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; });
                
                el.addEventListener('click', () => {
                    const type = el.dataset.type;
                    if (type === 'folder') {
                        this.currentPath.push({ id: el.dataset.id, name: el.dataset.name });
                        const container = document.getElementById('content-area');
                        const headerActions = document.getElementById('header-actions');
                        this.renderDrive(container, headerActions);
                    } else if (type === 'link') {
                        const url = el.dataset.url;
                        if (url) window.open(url, '_blank');
                    }
                });
            });

        } catch (error) {
            console.error("Error cargando archivos:", error);
            grid.innerHTML = `<div style="text-align: center; grid-column: 1 / -1; color: #d9534f; padding: 20px;">Error al cargar los recursos. Revisa la consola.</div>`;
        }
    }

    async handleNewFolder(container, headerActions) {
        const folderName = prompt("Nombre de la nueva carpeta:");
        if (!folderName || folderName.trim() === '') return;

        const parentId = this.currentPath[this.currentPath.length - 1].id;
        const authorId = this.app.currentUser?.id || 'unknown';

        await this.app.db.createDriveItem({
            name: folderName.trim(),
            type: 'folder',
            parentId: parentId,
            authorId: authorId
        });

        await this.renderDrive(container, headerActions);
    }

    async handleAddLink(container, headerActions) {
        const linkName = prompt("Nombre del recurso:");
        if (!linkName || linkName.trim() === '') return;

        let linkUrl = prompt("URL del recurso (ej. https://youtube.com/...):");
        if (!linkUrl || linkUrl.trim() === '') return;

        if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
            linkUrl = 'https://' + linkUrl;
        }

        const parentId = this.currentPath[this.currentPath.length - 1].id;
        const authorId = this.app.currentUser?.id || 'unknown';

        await this.app.db.createDriveItem({
            name: linkName.trim(),
            type: 'link',
            url: linkUrl.trim(),
            parentId: parentId,
            authorId: authorId
        });

        await this.renderDrive(container, headerActions);
    }
}