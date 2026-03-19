export class BookmarksController {
    constructor(app) {
        this.app = app;
        this.bookmarks = [];
        this.allTags = [];
    }

    async renderBookmarks(container) {
        container.innerHTML = `<div style="padding: 20px; text-align: center;">Cargando marcadores...</div>`;

        // Load data
        const userId = this.app.currentUser.id;
        this.bookmarks = await this.app.db.getBookmarks(userId);
        this.extractAllTags();

        // Render main view
        container.innerHTML = `
            <div class="bookmarks-container">
                <div class="bookmarks-header">
                    <input type="text" id="bookmarks-search" placeholder="Buscar por título o etiqueta..." class="login-input" style="max-width:300px; display:inline-block; margin-right:15px;">
                    <button class="btn-primary" id="btn-add-bookmark">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Añadir Marcador
                    </button>
                </div>
                <div id="bookmarks-list" class="bookmark-grid"></div>
            </div>
        `;

        this.renderBookmarksList(this.bookmarks);

        // Event listeners
        document.getElementById('btn-add-bookmark').addEventListener('click', () => {
            this.showBookmarkModal();
        });

        document.getElementById('bookmarks-search').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (!term) {
                this.renderBookmarksList(this.bookmarks);
                return;
            }
            const filtered = this.bookmarks.filter(b => 
                b.name.toLowerCase().includes(term) || 
                (b.tags && b.tags.some(t => t.toLowerCase().includes(term)))
            );
            this.renderBookmarksList(filtered);
        });
    }

    extractAllTags() {
        const tagsSet = new Set();
        this.bookmarks.forEach(b => {
            if (b.tags) {
                b.tags.forEach(t => tagsSet.add(t.trim()));
            }
        });
        this.allTags = Array.from(tagsSet).sort();
    }

    renderBookmarksList(bookmarksToRender) {
        const listContainer = document.getElementById('bookmarks-list');
        if (!listContainer) return;

        if (bookmarksToRender.length === 0) {
            listContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #666; padding: 40px;">No se encontraron marcadores.</div>`;
            return;
        }

        listContainer.innerHTML = bookmarksToRender.map(b => `
            <div class="bookmark-card">
                <div class="bookmark-card-content">
                    <h3 class="bookmark-title">
                        <a href="${b.url}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(b.name)}</a>
                    </h3>
                    <a href="${b.url}" target="_blank" rel="noopener noreferrer" class="bookmark-url" title="${b.url}">${this.escapeHtml(b.url)}</a>
                    <div class="bookmark-tags">
                        ${(b.tags || []).map(t => `<span class="tag-badge">${this.escapeHtml(t)}</span>`).join('')}
                    </div>
                </div>
                <div class="bookmark-actions">
                    <button class="btn-icon" onclick="app.bookmarksController.editBookmark('${b.id}')" title="Editar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon btn-icon-danger" onclick="app.bookmarksController.deleteBookmark('${b.id}')" title="Eliminar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    editBookmark(id) {
        const bookmark = this.bookmarks.find(b => b.id === id);
        if (bookmark) {
            this.showBookmarkModal(bookmark);
        }
    }

    deleteBookmark(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este marcador?')) {
            this.app.db.deleteBookmark(id).then(() => {
                this.bookmarks = this.bookmarks.filter(b => b.id !== id);
                this.extractAllTags();
                const term = document.getElementById('bookmarks-search') ? document.getElementById('bookmarks-search').value.toLowerCase().trim() : '';
                
                if(term) {
                     const filtered = this.bookmarks.filter(b => 
                        b.name.toLowerCase().includes(term) || 
                        (b.tags && b.tags.some(t => t.toLowerCase().includes(term)))
                    );
                    this.renderBookmarksList(filtered);
                } else {
                     this.renderBookmarksList(this.bookmarks);
                }
            }).catch(err => {
                console.error("Error al eliminar marcador:", err);
                alert("Error al eliminar el marcador.");
            });
        }
    }

    showBookmarkModal(bookmark = null) {
        const isEditing = !!bookmark;
        const modalId = 'bookmark-modal';
        
        let tagsDatalist = `<datalist id="user-tags-list">`;
        this.allTags.forEach(t => {
            tagsDatalist += `<option value="${this.escapeHtml(t)}">`;
        });
        tagsDatalist += `</datalist>`;

        const modalHtml = `
            <div class="modal-overlay" id="${modalId}" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>${isEditing ? 'Editar Marcador' : 'Añadir Marcador'}</h3>
                        <button class="btn-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="bookmark-form">
                            <div class="form-group">
                                <label for="bookmark-url">URL</label>
                                <input type="url" id="bookmark-url" class="login-input" placeholder="https://ejemplo.com" value="${isEditing ? this.escapeHtml(bookmark.url) : ''}" required>
                                <small style="color: #666; font-size: 12px;">Debe incluir http:// o https://</small>
                            </div>
                            <div class="form-group">
                                <label for="bookmark-name">Nombre</label>
                                <input type="text" id="bookmark-name" class="login-input" placeholder="Título del enlace" value="${isEditing ? this.escapeHtml(bookmark.name) : ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="bookmark-tags">Etiquetas (separadas por comas)</label>
                                <input type="text" id="bookmark-tags" class="login-input" list="user-tags-list" placeholder="React, Diseño, Tutorial..." value="${isEditing && bookmark.tags ? this.escapeHtml(bookmark.tags.join(', ')) : ''}">
                                ${tagsDatalist}
                            </div>
                            <div id="bookmark-error" style="color: #ef4444; margin-bottom: 10px; font-size: 14px; display: none;"></div>
                            <div style="text-align: right; margin-top: 20px;">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('${modalId}').remove()" style="margin-right: 10px;">Cancelar</button>
                                <button type="submit" class="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('bookmark-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const urlInput = document.getElementById('bookmark-url').value.trim();
            const nameInput = document.getElementById('bookmark-name').value.trim();
            const tagsInput = document.getElementById('bookmark-tags').value.trim();
            const errorDiv = document.getElementById('bookmark-error');

            if (!this.isValidUrl(urlInput)) {
                errorDiv.textContent = "La URL no es válida. Asegúrate de incluir http:// o https://";
                errorDiv.style.display = "block";
                return;
            }
            errorDiv.style.display = "none";

            const tagsArray = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

            const bookmarkData = {
                url: urlInput,
                name: nameInput,
                tags: tagsArray,
                userId: this.app.currentUser.id
            };

            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';

            try {
                if (isEditing) {
                    await this.app.db.updateBookmark(bookmark.id, bookmarkData);
                    const index = this.bookmarks.findIndex(b => b.id === bookmark.id);
                    if (index !== -1) {
                        this.bookmarks[index] = { ...this.bookmarks[index], ...bookmarkData };
                    }
                } else {
                    const newId = await this.app.db.addBookmark(bookmarkData);
                    this.bookmarks.unshift({ id: newId, ...bookmarkData, createdAt: new Date().toISOString() });
                }

                this.extractAllTags();
                const term = document.getElementById('bookmarks-search') ? document.getElementById('bookmarks-search').value.toLowerCase().trim() : '';
                if(term) {
                     const filtered = this.bookmarks.filter(b => 
                        b.name.toLowerCase().includes(term) || 
                        (b.tags && b.tags.some(t => t.toLowerCase().includes(term)))
                    );
                    this.renderBookmarksList(filtered);
                } else {
                     this.renderBookmarksList(this.bookmarks);
                }

                document.getElementById(modalId).remove();
            } catch (err) {
                console.error("Error saving bookmark", err);
                errorDiv.textContent = "Hubo un error al guardar el marcador. Inténtalo de nuevo.";
                errorDiv.style.display = "block";
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar';
            }
        });
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch (_) {
            return false;
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
             .toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
}
