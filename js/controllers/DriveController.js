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
                        <button id="btn-new-folder" class="btn" style="background-color: var(--verde-codigo); color: white; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.95rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" onmouseover="this.style.filter='brightness(90%)'" onmouseout="this.style.filter=''">
                            📁 Nueva Carpeta
                        </button>
                        <button id="btn-add-link" class="btn" style="background-color: var(--azul-claridad); color: white; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.95rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" onmouseover="this.style.filter='brightness(90%)'" onmouseout="this.style.filter=''">
                            🔗 Añadir Recurso
                        </button>
                        <button id="btn-upload-file" class="btn" style="background-color: #f39c12; color: white; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.95rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" onmouseover="this.style.filter='brightness(90%)'" onmouseout="this.style.filter=''">
                            📤 Subir Archivo
                        </button>
                        <input type="file" id="hidden-file-input" style="display: none;">
                    </div>
                </div>

                <div id="drive-items-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                    <div style="text-align: center; grid-column: 1 / -1; color: var(--text-light); padding: 40px;">Cargando contenido...</div>
                </div>
            </div>
        `;

        // Breadcrumbs Events
        container.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (index < this.currentPath.length - 1) {
                    this.currentPath = this.currentPath.slice(0, index + 1);
                    this.renderDrive(container, headerActions);
                }
            });
        });

        // Safe Button Events
        const btnNewFolder = container.querySelector('#btn-new-folder');
        const btnAddLink = container.querySelector('#btn-add-link');
        const btnUploadFile = container.querySelector('#btn-upload-file');
        const hiddenFileInput = container.querySelector('#hidden-file-input');

        if (btnNewFolder) {
            btnNewFolder.addEventListener('click', () => this.handleNewFolder(container, headerActions));
        }
        if (btnAddLink) {
            btnAddLink.addEventListener('click', () => this.handleAddLink(container, headerActions));
        }
        if (btnUploadFile && hiddenFileInput) {
            btnUploadFile.addEventListener('click', () => hiddenFileInput.click());
            hiddenFileInput.addEventListener('change', (e) => this.handleFileUpload(e, container, headerActions));
        }

        // Load content
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
            const others = items.filter(i => i.type !== 'folder');

            grid.innerHTML = [...folders, ...others].map(item => {
                let iconSvg = '';
                if (item.type === 'folder') {
                    iconSvg = `<svg width="54" height="54" viewBox="0 0 24 24" fill="#e3f2fd" stroke="#007bff" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
                } else if (item.type === 'link') {
                    iconSvg = `<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #17a2b8;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
                } else {
                    iconSvg = `<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#f39c12" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
                }

                return `
                <div class="drive-item" data-id="${item.id}" data-type="${item.type}" data-name="${item.name}" data-url="${item.url || ''}" style="background: white; border-radius: 10px; padding: 20px 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid var(--border-color); transition: all 0.2s ease;">
                    ${iconSvg}
                    <span style="margin-top: 15px; font-weight: 600; font-size: 0.95rem; word-break: break-word; line-height: 1.3; color: var(--text-color);">${item.name}</span>
                </div>
                `;
            }).join('');

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
                    } else {
                        const url = el.dataset.url;
                        if (url) window.open(url, '_blank');
                    }
                });
            });

        } catch (error) {
            console.error("Error loading items:", error);
            grid.innerHTML = `<div style="text-align: center; grid-column: 1 / -1; color: #d9534f; padding: 20px;">Error al cargar. Revisa la consola.</div>`;
        }
    }

    async handleNewFolder(container, headerActions) {
        const folderName = prompt("Nombre de la nueva carpeta:");
        if (!folderName || folderName.trim() === '') return;
        const parentId = this.currentPath[this.currentPath.length - 1].id;
        const authorId = this.app.currentUser?.id || 'unknown';
        await this.app.db.createDriveItem({ name: folderName.trim(), type: 'folder', parentId: parentId, authorId: authorId });
        await this.renderDrive(container, headerActions);
    }

    async handleAddLink(container, headerActions) {
        const linkName = prompt("Nombre del recurso:");
        if (!linkName || linkName.trim() === '') return;
        let linkUrl = prompt("URL del recurso:");
        if (!linkUrl || linkUrl.trim() === '') return;
        if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) linkUrl = 'https://' + linkUrl;
        const parentId = this.currentPath[this.currentPath.length - 1].id;
        const authorId = this.app.currentUser?.id || 'unknown';
        await this.app.db.createDriveItem({ name: linkName.trim(), type: 'link', url: linkUrl.trim(), parentId: parentId, authorId: authorId });
        await this.renderDrive(container, headerActions);
    }

    async compressImage(file) {
        return new Promise((resolve) => {
            if (!file.type.match(/image\/(jpeg|png|webp)/)) {
                resolve(file);
                return;
            }
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const compressedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, file.type, 0.7);
            };
            img.onerror = () => resolve(file);
        });
    }

    async handleFileUpload(event, container, headerActions) {
        const file = event.target.files[0];
        if (!file) return;

        event.target.value = ''; // Reset input to allow choosing same file again

        const grid = document.getElementById('drive-items-grid');
        if (grid) {
            grid.insertAdjacentHTML('afterbegin', `
                <div id="uploading-indicator" style="grid-column: 1 / -1; padding: 15px; background: #fff3cd; color: #856404; text-align: center; border-radius: 8px; font-weight: bold; border: 1px solid #ffeeba; margin-bottom: 20px;">
                    Subiendo "${file.name}"... Por favor espera.
                </div>
            `);
        }

        try {
            const fileToUpload = await this.compressImage(file);
            
            const formData = new FormData();
            formData.append('file', fileToUpload, fileToUpload.name);

            const response = await fetch('upload.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error de red o del servidor remoto');
            }

            const result = await response.json();
            
            if (result.status !== 'ok') {
                throw new Error(result.message || 'Error en PHP al guardar el archivo');
            }

            const downloadUrl = result.url; // Ruta local devolvido por upload.php

            let docType = 'file';
            if (fileToUpload.type.startsWith('image/')) docType = 'image';

            const parentId = this.currentPath[this.currentPath.length - 1].id;
            const authorId = this.app.currentUser?.id || 'unknown';

            await this.app.db.createDriveItem({
                name: fileToUpload.name,
                type: docType,
                url: downloadUrl,
                parentId: parentId,
                authorId: authorId
            });

            await this.renderDrive(container, headerActions);
        } catch (error) {
            console.error("Error subiendo archivo:", error);
            alert("Ocurrió un error al subir el archivo: " + error.message);
            await this.renderDrive(container, headerActions);
        }
    }
}