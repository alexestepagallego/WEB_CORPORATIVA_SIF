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
                    <form id="bookmarks-search-form" class="search-container" style="max-width:350px; width:100%; margin-right:15px;" onsubmit="return false;">
                        <input type="text" id="bookmarks-search" placeholder="Buscar por título o etiqueta..." style="flex:1;">
                        <button type="submit" id="btn-search-bookmarks" title="Buscar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </form>
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

        // Event listeners (Delegación de eventos para mayor robustez)
        container.addEventListener('click', (e) => {
            const addBtn = e.target.closest('#btn-add-bookmark');
            if (addBtn) {
                this.showBookmarkModal();
            }
        });

        const searchForm = document.getElementById('bookmarks-search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const term = document.getElementById('bookmarks-search').value.toLowerCase().trim();
                if (!term) {
                    this.renderBookmarksList(this.bookmarks);
                    return;
                }
                const filtered = this.bookmarks.filter(b => 
                    b.name.toLowerCase().includes(term) || 
                    (b.tags && b.tags.some(t => {
                        const name = typeof t === 'object' && t !== null ? t.text : String(t);
                        return name.toLowerCase().includes(term);
                    }))
                );
                this.renderBookmarksList(filtered);
            });
        }
    }

    extractAllTags() {
        const tagsMap = new Map();
        this.bookmarks.forEach(b => {
            if (b.tags) {
                b.tags.forEach(t => {
                    const isObj = typeof t === 'object' && t !== null;
                    const text = (isObj ? t.text : String(t)).trim();
                    const theme = isObj ? t.theme : 'tag-blue';
                    if (!tagsMap.has(text.toLowerCase())) {
                        tagsMap.set(text.toLowerCase(), { text, theme });
                    }
                });
            }
        });
        this.allTags = Array.from(tagsMap.values()).sort((a,b) => a.text.localeCompare(b.text));
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
                        ${(b.tags || []).map(t => {
                            const isObj = typeof t === 'object' && t !== null;
                            const label = isObj ? t.text : String(t);
                            const theme = isObj ? t.theme : 'tag-blue';
                            return `<span class="tag-badge ${theme}">${this.escapeHtml(label)}</span>`;
                        }).join('')}
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
        
        // Parse existing tags
        let currentTags = [];
        if (isEditing && bookmark.tags) {
            currentTags = bookmark.tags.map(t => {
                const isObj = typeof t === 'object' && t !== null;
                return {
                    text: isObj ? t.text : String(t),
                    theme: isObj ? t.theme : 'tag-blue'
                };
            });
        }

        const modalHtml = `
            <div class="modal-overlay" id="${modalId}" style="display: flex;">
                <div class="modal-content modal-content-elevated" style="max-width: 500px; width: 100%;">
                    <div class="modal-header">
                        <h3>${isEditing ? 'Editar Marcador' : 'Añadir Marcador'}</h3>
                        <button class="btn-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="bookmark-form">
                            <div class="form-card-bg">
                                <div class="form-group">
                                    <label for="bookmark-url">URL</label>
                                    <input type="url" id="bookmark-url" class="login-input" placeholder="https://ejemplo.com" value="${isEditing ? this.escapeHtml(bookmark.url) : ''}" required>
                                </div>
                                <div class="form-group" style="margin-bottom:0;">
                                    <label for="bookmark-name">Nombre</label>
                                    <input type="text" id="bookmark-name" class="login-input" placeholder="Título del enlace" value="${isEditing ? this.escapeHtml(bookmark.name) : ''}" required>
                                </div>
                            </div>

                            <div class="form-card-bg">
                                <label style="display:block; margin-bottom:0.5rem; font-weight:600;">Etiquetas</label>
                                <div id="modal-tags-list" style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom: 1rem;"></div>
                                
                                <div id="tag-editor-area" style="display:none; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border);">
                                    <div style="position:relative;">
                                        <input type="text" id="new-tag-text" class="login-input" placeholder="Nombre de etiqueta (ej: Tutorial)" autocomplete="off">
                                        <div id="autocomplete-suggestions" class="autocomplete-suggestions" style="display:none;"></div>
                                    </div>
                                    <div style="display:flex; gap:0.5rem; margin-top: 0.75rem; margin-bottom: 0.75rem;" id="tag-color-picker">
                                        <button type="button" class="color-picker-btn tag-blue selected" data-theme="tag-blue"></button>
                                        <button type="button" class="color-picker-btn tag-green" data-theme="tag-green"></button>
                                        <button type="button" class="color-picker-btn tag-red" data-theme="tag-red"></button>
                                        <button type="button" class="color-picker-btn tag-orange" data-theme="tag-orange"></button>
                                        <button type="button" class="color-picker-btn tag-purple" data-theme="tag-purple"></button>
                                    </div>
                                    <div style="display:flex; gap:0.5rem;">
                                        <button type="button" id="btn-save-tag" class="btn btn-sm btn-primary">Guardar Etiqueta</button>
                                        <button type="button" id="btn-cancel-tag" class="btn btn-sm btn-outline">Cancelar</button>
                                    </div>
                                </div>
                                <button type="button" id="btn-add-tag-trigger" class="btn btn-sm btn-outline" style="width:100%;">
                                    + Añadir Etiqueta
                                </button>
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

        // Tags Logic
        const renderModalTags = () => {
            const listEl = document.getElementById('modal-tags-list');
            if (!listEl) return;
            if (currentTags.length === 0) {
                listEl.innerHTML = `<span style="color:#94a3b8; font-size:0.85rem;">No hay etiquetas aplicadas.</span>`;
                return;
            }
            listEl.innerHTML = currentTags.map((t, idx) => `
                <span class="tag-badge ${t.theme} interactive" data-idx="${idx}">
                    ${this.escapeHtml(t.text)}
                    <span class="remove-tag" data-idx="${idx}" title="Eliminar etiqueta">&times;</span>
                </span>
            `).join('');
        };
        renderModalTags();

        let editingTagIndex = -1;
        const tagEditorArea = document.getElementById('tag-editor-area');
        const triggerBtn = document.getElementById('btn-add-tag-trigger');
        const newTagText = document.getElementById('new-tag-text');
        const colorBtns = document.querySelectorAll('#tag-color-picker .color-picker-btn');
        const suggestionsBox = document.getElementById('autocomplete-suggestions');

        const selectColorBtn = (theme) => {
            colorBtns.forEach(btn => btn.classList.remove('selected'));
            const b = document.querySelector(`#tag-color-picker .${theme}`);
            if (b) b.classList.add('selected');
        };

        const closeSuggestions = () => {
            if (suggestionsBox) suggestionsBox.style.display = 'none';
        };

        const openTagEditor = (idx = -1) => {
            editingTagIndex = idx;
            tagEditorArea.style.display = 'block';
            triggerBtn.style.display = 'none';
            closeSuggestions();
            if (idx >= 0) {
                const t = currentTags[idx];
                newTagText.value = t.text;
                selectColorBtn(t.theme);
            } else {
                newTagText.value = '';
                selectColorBtn('tag-blue');
            }
            newTagText.focus();
        };

        const closeTagEditor = () => {
            tagEditorArea.style.display = 'none';
            triggerBtn.style.display = 'block';
            editingTagIndex = -1;
            closeSuggestions();
        };

        triggerBtn.addEventListener('click', () => openTagEditor(-1));
        document.getElementById('btn-cancel-tag').addEventListener('click', closeTagEditor);

        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                selectColorBtn(e.target.dataset.theme);
            });
        });

        // Autocomplete logic
        newTagText.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();
            if (!val) {
                closeSuggestions();
                return;
            }
            const matches = this.allTags.filter(t => t.text.toLowerCase().includes(val));
            if (matches.length > 0) {
                suggestionsBox.innerHTML = matches.map((m) => `
                    <div class="autocomplete-suggestion" data-text="${this.escapeHtml(m.text)}" data-theme="${m.theme}">
                        <span class="tag-badge ${m.theme}" style="pointer-events:none;">${this.escapeHtml(m.text)}</span>
                    </div>
                `).join('');
                suggestionsBox.style.display = 'block';
            } else {
                closeSuggestions();
            }
        });

        suggestionsBox.addEventListener('click', (e) => {
            const item = e.target.closest('.autocomplete-suggestion');
            if (item) {
                const txt = item.dataset.text;
                const theme = item.dataset.theme;
                if (editingTagIndex >= 0) {
                    currentTags[editingTagIndex] = { text: txt, theme };
                } else {
                    currentTags.push({ text: txt, theme });
                }
                renderModalTags();
                closeTagEditor();
            }
        });

        // Hide suggestions on outside click
        document.addEventListener('click', (e) => {
            if (suggestionsBox && suggestionsBox.style.display === 'block' && !e.target.closest('#tag-editor-area')) {
                closeSuggestions();
            }
        });

        document.getElementById('btn-save-tag').addEventListener('click', () => {
            const txt = newTagText.value.trim();
            if (!txt) return;
            const selectedBtn = document.querySelector('#tag-color-picker .selected');
            const theme = selectedBtn ? selectedBtn.dataset.theme : 'tag-blue';
            
            if (editingTagIndex >= 0) {
                currentTags[editingTagIndex] = { text: txt, theme };
            } else {
                currentTags.push({ text: txt, theme });
            }
            renderModalTags();
            closeTagEditor();
        });

        document.getElementById('modal-tags-list').addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-tag');
            if (removeBtn) {
                e.stopPropagation();
                const idx = parseInt(removeBtn.dataset.idx, 10);
                currentTags.splice(idx, 1);
                renderModalTags();
                return;
            }
            const badge = e.target.closest('.tag-badge.interactive');
            if (badge) {
                const idx = parseInt(badge.dataset.idx, 10);
                openTagEditor(idx);
            }
        });

        // Submit form (Cleaned logic)
        document.getElementById('bookmark-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const urlInput = document.getElementById('bookmark-url').value.trim();
            const nameInput = document.getElementById('bookmark-name').value.trim();
            const errorDiv = document.getElementById('bookmark-error');

            if (!this.isValidUrl(urlInput)) {
                errorDiv.textContent = "La URL no es válida. Asegúrate de incluir http:// o https://";
                errorDiv.style.display = "block";
                return;
            }
            
            if (!this.app.currentUser) {
                errorDiv.textContent = "Error: Sesión no válida. Por favor, vuelva a iniciar sesión.";
                errorDiv.style.display = "block";
                return;
            }
            errorDiv.style.display = "none";

            const bookmarkData = {
                url: urlInput,
                name: nameInput,
                tags: currentTags,
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
                const searchEl = document.getElementById('bookmarks-search');
                const term = searchEl ? searchEl.value.toLowerCase().trim() : '';
                if(term) {
                     const filtered = this.bookmarks.filter(b => 
                        b.name.toLowerCase().includes(term) || 
                        (b.tags && b.tags.some(t => {
                            const name = typeof t === 'object' && t !== null ? t.text : String(t);
                            return name.toLowerCase().includes(term);
                        }))
                    );
                    this.renderBookmarksList(filtered);
                } else {
                     this.renderBookmarksList(this.bookmarks);
                }

                document.getElementById(modalId).remove();
                this.showNotification("Marcador guardado con éxito", "success");
            } catch (err) {
                console.error("[Bookmarks] Error al guardar:", err);
                errorDiv.textContent = "Hubo un error al guardar el marcador. Puede que no tengas permisos en la Base de Datos.";
                errorDiv.style.display = "block";
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar';
                this.showNotification("Error al guardar el marcador", "error");
            }
        });
    }

    showNotification(message, type = 'success') {
        const container = document.getElementById('alert-container');
        if (!container) return;

        const alertId = 'toast-' + Date.now();
        const bgColor = type === 'success' ? '#dcfce7' : '#fee2e2';
        const borderColor = type === 'success' ? '#16a34a' : '#ef4444';
        const textColor = type === 'success' ? '#166534' : '#991b1b';

        const alertHtml = `
            <div id="${alertId}" class="alerta-normal" style="background-color: ${bgColor}; border-color: ${borderColor}; color: ${textColor}; z-index: 9999;">
                <div class="alerta-header">
                    <span>${type === 'success' ? 'Éxito' : 'Error'}</span>
                    <button class="alerta-close" onclick="document.getElementById('${alertId}').remove()">&times;</button>
                </div>
                <div>${message}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', alertHtml);

        setTimeout(() => {
            const el = document.getElementById(alertId);
            if (el) el.remove();
        }, 5000);
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
