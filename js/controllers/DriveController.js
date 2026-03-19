export class DriveController {
    constructor(app) {
        this.app = app;
        // Breadcrumb history or just use current parentId
        // Example: [{id: 'root', name: 'Inicio'}, {id: 'folder_123', name: 'Recursos'}]
        this.currentPath = [{ id: 'root', name: 'Inicio' }];
    }

    async renderDrive(container, headerActions) {
        const currentFolder = this.currentPath[this.currentPath.length - 1];
        
        container.innerHTML = `
            <div class="drive-container" style="padding: 20px;">
                <div class="drive-breadcrumbs" style="margin-bottom: 20px; font-size: 1.2rem; font-weight: 600; color: var(--text-color);">
                    ${this.currentPath.map((folder, index) => `
                        <span class="breadcrumb-item" data-index="${index}" style="cursor: pointer; color: ${index === this.currentPath.length - 1 ? 'var(--text-color)' : 'var(--primary-color)'};">
                            ${folder.name}
                        </span>
                        ${index < this.currentPath.length - 1 ? ' &gt; ' : ''}
                    `).join('')}
                </div>
                <div id="drive-items-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                    <div style="text-align: center; grid-column: 1 / -1; color: var(--text-light);">Cargando...</div>
                </div>
            </div>
        `;

        headerActions.innerHTML = `
            <button id="btn-new-folder" class="btn" style="margin-right: 10px; background-color: var(--secondary-color); color: white;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px; vertical-align:middle;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    <line x1="12" y1="11" x2="12" y2="17"></line>
                    <line x1="9" y1="14" x2="15" y2="14"></line>
                </svg> Nueva Carpeta
            </button>
            <button id="btn-add-link" class="btn" style="background-color: var(--primary-color); color: white;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px; vertical-align:middle;">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg> Añadir Recurso
            </button>
        `;

        // Event Listeners for Breadcrumbs
        container.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (index < this.currentPath.length - 1) {
                    this.currentPath = this.currentPath.slice(0, index + 1);
                    this.renderDrive(container, headerActions);
                }
            });
        });

        // Event Listeners for Buttons
        document.getElementById('btn-new-folder').addEventListener('click', () => this.handleNewFolder(container, headerActions));
        document.getElementById('btn-add-link').addEventListener('click', () => this.handleAddLink(container, headerActions));

        // Fetch and render items
        await this.loadItems(currentFolder.id);
    }

    async loadItems(parentId) {
        const grid = document.getElementById('drive-items-grid');
        if (!grid) return;

        try {
            const items = await this.app.db.getDriveItemsByParent(parentId);
            
            if (items.length === 0) {
                grid.innerHTML = `<div style="text-align: center; grid-column: 1 / -1; color: var(--text-light); padding: 40px;">Esta carpeta está vacía. Selecciona "Añadir Recurso" para empezar.</div>`;
                return;
            }

            // Separate folders and links
            const folders = items.filter(i => i.type === 'folder');
            const links = items.filter(i => i.type === 'link');

            grid.innerHTML = [...folders, ...links].map(item => `
                <div class="drive-item" data-id="${item.id}" data-type="${item.type}" data-name="${item.name}" data-url="${item.url || ''}" style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid var(--border-color); transition: transform 0.2s, box-shadow 0.2s;">
                    ${item.type === 'folder' 
                        ? `<svg width="48" height="48" viewBox="0 0 24 24" fill="var(--primary-light)" stroke="var(--primary-color)" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
                        : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--secondary-color);"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`
                    }
                    <span style="margin-top: 10px; font-weight: 500; font-size: 0.9rem; word-break: break-word; line-height: 1.2;">${item.name}</span>
                </div>
            `).join('');

            // Hover effect and click listeners
            grid.querySelectorAll('.drive-item').forEach(el => {
                el.addEventListener('mouseenter', () => { el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)'; });
                el.addEventListener('mouseleave', () => { el.style.transform = ''; el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)'; });
                
                el.addEventListener('click', () => {
                    const type = el.dataset.type;
                    if (type === 'folder') {
                        this.currentPath.push({ id: el.dataset.id, name: el.dataset.name });
                        // Re-render whole view to update breadcrumbs
                        const container = document.getElementById('content-area');
                        const headerActions = document.getElementById('header-actions');
                        this.renderDrive(container, headerActions);
                    } else if (type === 'link') {
                        const url = el.dataset.url;
                        if (url) {
                            window.open(url, '_blank');
                        }
                    }
                });
            });

        } catch (error) {
            console.error("Error loading drive items:", error);
            grid.innerHTML = `<div style="text-align: center; grid-column: 1 / -1; color: red;">Error al cargar los recursos.</div>`;
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

        // Reload items
        await this.loadItems(parentId);
    }

    async handleAddLink(container, headerActions) {
        const linkName = prompt("Nombre del recurso:");
        if (!linkName || linkName.trim() === '') return;

        let linkUrl = prompt("URL del recurso (ej. https://youtube.com/...):");
        if (!linkUrl || linkUrl.trim() === '') return;

        // Añadir https:// a la URL si no viene provisto
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

        // Reload items
        await this.loadItems(parentId);
    }
}
