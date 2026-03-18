export class SocialNetworkController {
    constructor(app) {
        this.app = app;
        this.unsubscribePosts = null;
    }

    async renderSocialNetwork(container) {
        let composerAvatarHtml = `<div class="avatar">${this.app.currentUser.name ? this.app.currentUser.name.charAt(0).toUpperCase() : 'U'}</div>`;
        if (this.app.currentUser.avatarBase64) {
            composerAvatarHtml = `<img src="${this.app.currentUser.avatarBase64}" class="avatar" style="object-fit: cover;" alt="${this.app.currentUser.name}">`;
        }

        container.innerHTML = `
            <div class="social-layout">
                <div class="social-main">
                    <!-- Post Composer -->
                    <div class="post-composer card">
                        <div class="composer-header">
                            ${composerAvatarHtml}
                            <textarea id="post-input" placeholder="¿Qué estás pensando, ${this.app.currentUser.name?.split(' ')[0] || 'usuario'}?" rows="3"></textarea>
                        </div>
                        <div class="composer-actions">
                            <div>
                                <button class="btn-icon-action" onclick="document.getElementById('post-image-input').click()" title="Adjuntar foto">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                    Foto
                                </button>
                                <input type="file" id="post-image-input" class="hidden" accept="image/*" onchange="app.socialNetworkController.handleImageUpload(event)">
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="app.socialNetworkController.createPost()">Publicar</button>
                        </div>
                        <div id="image-preview-container" class="hidden">
                            <img id="image-preview" src="" alt="Preview">
                            <button class="btn-remove-image" onclick="app.socialNetworkController.removeImage()">✕</button>
                        </div>
                    </div>

                    <!-- Feed -->
                    <div id="social-feed" class="social-feed">
                        <div class="loading-spinner">Cargando publicaciones...</div>
                    </div>
                </div>

                <!-- Sidebar (Widgets) -->
                <div class="social-sidebar">
                    <div class="widget card">
                        <h3 class="widget-title">Sobre esta red</h3>
                        <p class="text-sm">Un espacio colaborativo para compartir ideas, recursos y experiencias entre profesores y alumnos de SGT.</p>
                    </div>
                    
                    <div id="network-members" class="widget card">
                        <h3 class="widget-title">Miembros</h3>
                        <div class="loading-spinner text-sm">Cargando...</div>
                    </div>
                </div>
            </div>
        `;

        this.currentImageDataUrl = null;
        this.subscribeToFeed();
        this.loadMembers();
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                this.currentImageDataUrl = await this.compressImage(e.target.result, 800, 0.7);
                const previewContainer = document.getElementById('image-preview-container');
                const previewImage = document.getElementById('image-preview');
                previewImage.src = this.currentImageDataUrl;
                previewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage() {
        this.currentImageDataUrl = null;
        document.getElementById('post-image-input').value = '';
        document.getElementById('image-preview-container').classList.add('hidden');
    }

    async createPost() {
        const input = document.getElementById('post-input');
        const content = input.value.trim();

        if (!content && !this.currentImageDataUrl) return;

        const postData = {
            authorId: this.app.currentUser.id,
            content: content,
            imageUrl: this.currentImageDataUrl, // In a real app, upload to Storage and save URL. B64 is okay for small demo.
            timestamp: new Date().toISOString(),
            likes: [],
            comments: []
        };

        try {
            await this.app.db.addPost(postData);
            input.value = '';
            this.removeImage();
            
            // Show toast or slight feedback here if desired
        } catch (error) {
            console.error("Error creating post:", error);
            alert("No se pudo publicar. Revisa la consola.");
        }
    }

    async subscribeToFeed() {
        if (this.unsubscribePosts) {
            this.unsubscribePosts();
        }

        const feedContainer = document.getElementById('social-feed');
        
        this.unsubscribePosts = await this.app.db.subscribeToPosts((posts) => {
            if (!feedContainer) return; // View changed

            if (posts.length === 0) {
                feedContainer.innerHTML = `
                    <div class="empty-state card">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <p>No hay publicaciones aún. ¡Sé el primero en compartir algo!</p>
                    </div>
                `;
                return;
            }

            feedContainer.innerHTML = '';
            posts.forEach(post => {
                    const postEl = document.createElement('div');
                    postEl.className = 'post card';
                    postEl.innerHTML = this.buildPostHTML(post);
                    feedContainer.appendChild(postEl);
            });
        });
    }

    async loadMembers() {
        const membersContainer = document.getElementById('network-members');
        if (!membersContainer) return;

        try {
            const users = await this.app.db.getAllUsers();
            
            if (!users || users.length === 0) {
                membersContainer.innerHTML = '<h3 class="widget-title">Miembros</h3><p class="text-sm">No hay miembros disponibles.</p>';
                return;
            }

            // Exclude current user from the top if wanted, but fine to show them
            let html = '<h3 class="widget-title">Miembros</h3><div class="members-list">';
            
            users.forEach(user => {
                const initial = user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
                const displayName = user.name || user.email;
                const roleNames = {
                    'admin': 'Administrador',
                    'tutor': 'Tutor',
                    'student': 'Alumno'
                };
                const displayRole = roleNames[user.role] || user.role;

                let avatarHtml = `<div class="avatar avatar-sm">${initial}</div>`;
                if (user.avatarBase64) {
                    avatarHtml = `<img src="${user.avatarBase64}" class="avatar avatar-sm" style="object-fit: cover;" alt="${displayName}">`;
                }

                html += `
                    <div class="member-item">
                        <a onclick="app.navigate('profile', '${user.id}')" class="avatar-link">
                            ${avatarHtml}
                        </a>
                        <div class="member-info">
                            <a onclick="app.navigate('profile', '${user.id}')" class="link-unstyled"><div class="member-name">${displayName}</div></a>
                            <div class="member-role">${displayRole}</div>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            membersContainer.innerHTML = html;

        } catch (error) {
            console.error("Error loading members:", error);
            membersContainer.innerHTML = '<h3 class="widget-title">Miembros</h3><p class="text-sm text-danger">Error al cargar usuarios.</p>';
        }
    }

    async toggleLike(postId) {
        try {
            await this.app.db.togglePostLike(postId, this.app.currentUser.id);
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    }

    toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-section-${postId}`);
        if (commentsSection) {
            commentsSection.classList.toggle('hidden');
        }
    }

    async submitComment(postId) {
        const input = document.getElementById(`comment-input-${postId}`);
        if (!input) return;
        
        const content = input.value.trim();
        if (!content) return;

        const commentData = {
            authorId: this.app.currentUser.id,
            content: content,
            timestamp: new Date().toISOString()
        };

        try {
            await this.app.db.addCommentToPost(postId, commentData);
            // StorageService listeners will automatically re-render the feed
        } catch (error) {
            console.error("Error submitting comment:", error);
            alert("No se pudo publicar el comentario.");
        }
    }

    buildPostHTML(post) {
        const dateObj = new Date(post.timestamp);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const roleNames = {
            'admin': 'Product Manager',
            'tutor': 'Líder Técnico',
            'student': 'Desarrollador'
        };
        const displayRole = roleNames[post.authorRole] || post.authorRole;

        // Render Comments
        let commentsHTML = '';
        if (post.comments && post.comments.length > 0) {
            commentsHTML = post.comments.map(c => {
                const cDate = new Date(c.timestamp);
                const cDateStr = cDate.toLocaleDateString() + ' ' + cDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                let cAvatarHtml = `<div class="avatar avatar-xs" title="${c.authorName}">${c.authorName.charAt(0).toUpperCase()}</div>`;
                if (c.authorAvatarBase64) {
                    cAvatarHtml = `<img src="${c.authorAvatarBase64}" class="avatar avatar-xs" style="object-fit: cover;" alt="${c.authorName}" title="${c.authorName}">`;
                }
                
                return `
                    <div class="comment-item">
                        ${cAvatarHtml}
                        <div class="comment-content-wrap">
                            <div class="comment-header">
                                <span class="comment-author">${c.authorName}</span>
                                <span class="comment-time">${cDateStr}</span>
                            </div>
                            <div class="comment-text">${this.escapeHtml(c.content)}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            commentsHTML = '<p class="text-muted text-sm" style="margin-bottom: 0;">No hay comentarios aún.</p>';
        }

        let pAvatarHtml = `<div class="avatar">${post.authorName.charAt(0).toUpperCase()}</div>`;
        if (post.authorAvatarBase64) {
            pAvatarHtml = `<img src="${post.authorAvatarBase64}" class="avatar" style="object-fit: cover;" alt="${post.authorName}">`;
        }

        return `
            <div class="post-header">
                <a onclick="app.navigate('profile', '${post.authorId}')" class="avatar-link">
                    ${pAvatarHtml}
                </a>
                <div class="post-meta">
                    <a onclick="app.navigate('profile', '${post.authorId}')" class="link-unstyled"><div class="post-author">${post.authorName}</div></a>
                    <div class="post-subtitle">${displayRole} • ${dateStr}</div>
                </div>
            </div>
            <div class="post-content">
                <p>${this.escapeHtml(post.content)}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image" alt="Post image">` : ''}
            </div>
            <div class="post-interactions-wrapper">
                <hr class="post-divider">
                <div class="post-interactions">
                    <button class="btn-interaction action-like ${post.likes?.includes(this.app.currentUser.id) ? 'active' : ''}" onclick="app.socialNetworkController.toggleLike('${post.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${post.likes?.includes(this.app.currentUser.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        ${post.likes?.length || 0}
                    </button>
                    <button class="btn-interaction action-comment" onclick="app.socialNetworkController.toggleComments('${post.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${post.comments?.length || 0}
                    </button>
                    <button class="btn-interaction action-share" onclick="app.socialNetworkController.sharePost('${post.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                    </button>
                </div>
                
                <!-- Comments Section -->
                <div id="comments-section-${post.id}" class="post-comments hidden">
                    <div class="comments-list">
                        ${commentsHTML}
                    </div>
                    <div class="comment-composer">
                        ${(() => {
                            if (this.app.currentUser.avatarBase64) {
                                return `<img src="${this.app.currentUser.avatarBase64}" class="avatar avatar-xs" style="object-fit: cover;" alt="${this.app.currentUser.name}">`;
                            }
                            return `<div class="avatar avatar-xs">${this.app.currentUser.name ? this.app.currentUser.name.charAt(0).toUpperCase() : 'U'}</div>`;
                        })()}
                        <input type="text" id="comment-input-${post.id}" class="comment-input" placeholder="Escribe un comentario..." onkeypress="if(event.key === 'Enter') app.socialNetworkController.submitComment('${post.id}')">
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;")
             .replace(/\\n/g, "<br>");
    }

    async sharePost(postId) {
        try {
            const post = await this.app.db.getPostById(postId);
            if (!post) {
                alert("No se pudo encontrar la publicación para compartir.");
                return;
            }

            // Create the repost template
            const shareText = `Recomiendo esta publicación de ${post.authorName}:\n\n"${post.content}"\n\n`;

            // If we're on the profile page, we need to navigate back to the main social network view
            // Because the composer is only rendered in the main view
            if (this.app.currentView === 'profile') {
                await this.app.navigate('social-network');
            }

            const inputElement = document.getElementById('post-input');
            if (inputElement) {
                inputElement.value = shareText;
                
                // If the original post had an image, attach it to our composer state
                if (post.imageUrl) {
                    this.currentImageDataUrl = post.imageUrl;
                    const previewContainer = document.getElementById('image-preview-container');
                    const previewImage = document.getElementById('image-preview');
                    if (previewContainer && previewImage) {
                        previewImage.src = this.currentImageDataUrl;
                        previewContainer.classList.remove('hidden');
                    }
                }

                // Scroll to top and focus
                window.scrollTo({ top: 0, behavior: 'smooth' });
                inputElement.focus();
                
                // Optional: set cursor at the end of the text
                inputElement.setSelectionRange(shareText.length, shareText.length);
            }

        } catch (error) {
            console.error("Error sharing post:", error);
        }
    }

    async renderProfile(container, userId) {
        if (this.unsubscribePosts) {
            this.unsubscribePosts();
            this.unsubscribePosts = null;
        }

        container.innerHTML = '<div class="loading-spinner">Cargando perfil...</div>';
        
        try {
            const users = await this.app.db.getAllUsers();
            const user = users.find(u => u.id === userId);
            
            if (!user) {
                container.innerHTML = '<div class="card"><p class="text-danger">Usuario no encontrado.</p></div>';
                return;
            }

            const initial = user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
            const displayName = user.name || user.email;
            const roleNames = {
                'admin': 'Administrador',
                'tutor': 'Tutor',
                'student': 'Alumno'
            };
            const displayRole = roleNames[user.role] || user.role;
            const bioText = user.bio || `¡Hola! Soy ${displayName} y este es mi espacio de trabajo en SGT. Contáctame si necesitas algo.`;
            const isOwnProfile = this.app.currentUser.id === userId;
            
            let avatarHtml = `<div class="profile-avatar">${initial}</div>`;
            if (user.avatarBase64) {
                avatarHtml = `<img src="${user.avatarBase64}" class="profile-avatar" style="object-fit: cover;" alt="Avatar">`;
            }

            container.innerHTML = `
                <div class="social-layout">
                    <div class="social-main" style="flex: 1; max-width: 800px; margin: 0 auto;">
                        <!-- Profile Card -->
                        <div class="card profile-card" id="profile-view-card">
                            ${avatarHtml}
                            <h2 class="profile-name">${displayName}</h2>
                            <div class="profile-role">${displayRole}</div>
                            <div class="profile-about">
                                <p><strong>Sobre mí:</strong> ${this.escapeHtml(bioText)}</p>
                            </div>
                        </div>
                        
                        <!-- Edit Profile Card (Hidden by default) -->
                        <div class="card profile-card hidden" id="profile-edit-card">
                            <div class="edit-avatar-container" onclick="document.getElementById('edit-avatar-input').click()">
                                ${avatarHtml}
                                <div class="edit-avatar-overlay">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                </div>
                            </div>
                            <input type="file" id="edit-avatar-input" class="hidden" accept="image/*" onchange="app.socialNetworkController.handleProfileAvatarChange(event)">
                            
                            <div class="form-group" style="width: 100%; max-width: 400px; margin-top: 1rem;">
                                <label for="edit-name-input">Nombre completo</label>
                                <input type="text" id="edit-name-input" class="form-control" value="${displayName}">
                            </div>
                            
                            <div class="form-group" style="width: 100%; max-width: 400px;">
                                <label for="edit-bio-input">Sobre mí</label>
                                <textarea id="edit-bio-input" class="form-control" rows="4">${user.bio || ''}</textarea>
                            </div>
                            
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="btn btn-secondary" onclick="app.socialNetworkController.cancelEditProfile()">Cancelar</button>
                                <button class="btn btn-primary" onclick="app.socialNetworkController.saveProfile()">Guardar Cambios</button>
                            </div>
                        </div>

                        <!-- User Posts -->
                        <h3 class="widget-title" style="margin-top: 20px;">Publicaciones recientes</h3>
                        <div id="profile-feed" class="social-feed">
                            <div class="loading-spinner">Cargando publicaciones...</div>
                        </div>
                    </div>
                </div>
            `;

            const feedContainer = document.getElementById('profile-feed');
            
            this.unsubscribePosts = await this.app.db.subscribeToPosts((posts) => {
                if (!feedContainer) return;
                
                const userPosts = posts.filter(p => p.authorId === userId);

                if (userPosts.length === 0) {
                    feedContainer.innerHTML = `
                        <div class="empty-state card">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <p>Este usuario aún no ha publicado nada.</p>
                        </div>
                    `;
                    return;
                }

                feedContainer.innerHTML = '';
                userPosts.forEach(post => {
                    const postEl = document.createElement('div');
                    postEl.className = 'post card';
                    postEl.innerHTML = this.buildPostHTML(post);
                    feedContainer.appendChild(postEl);
                });
            });

        } catch (error) {
            console.error("Error loading profile:", error);
            container.innerHTML = '<div class="card"><p class="text-danger">Error al cargar perfil.</p></div>';
        }
    }

    renderEditProfile() {
        document.getElementById('profile-view-card').classList.add('hidden');
        document.getElementById('profile-edit-card').classList.remove('hidden');
        this.newAvatarBase64 = null; // reset
    }

    cancelEditProfile() {
        document.getElementById('profile-edit-card').classList.add('hidden');
        document.getElementById('profile-view-card').classList.remove('hidden');
        this.newAvatarBase64 = null;
    }

    async handleProfileAvatarChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                this.newAvatarBase64 = await this.compressImage(e.target.result, 800, 0.7);
                // Update the preview immediately
                const avatarContainer = document.querySelector('.edit-avatar-container');
                if (avatarContainer) {
                    const existingImg = avatarContainer.querySelector('img.profile-avatar');
                    const existingDiv = avatarContainer.querySelector('div.profile-avatar');
                    
                    if (existingImg) {
                        existingImg.src = this.newAvatarBase64;
                    } else if (existingDiv) {
                        const img = document.createElement('img');
                        img.src = this.newAvatarBase64;
                        img.className = 'profile-avatar';
                        img.style.objectFit = 'cover';
                        img.alt = 'Avatar';
                        existingDiv.replaceWith(img);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    }

    async saveProfile() {
        const nameInput = document.getElementById('edit-name-input').value.trim();
        const bioInput = document.getElementById('edit-bio-input').value.trim();
        
        const profileData = {};
        if (nameInput) profileData.name = nameInput;
        // Always allow updating bio even if empty
        profileData.bio = bioInput; 
        
        if (this.newAvatarBase64) {
            profileData.avatarBase64 = this.newAvatarBase64;
        }

        try {
            const btn = document.querySelector('#profile-edit-card .btn-primary');
            btn.disabled = true;
            btn.textContent = 'Guardando...';

            const updatedUser = await this.app.db.updateUserProfile(this.app.currentUser.id, profileData);
            
            if (updatedUser) {
                this.app.currentUser = updatedUser;
                // Save to localStorage just in case authController uses it
                localStorage.setItem('sgt_currentUser', JSON.stringify(updatedUser));
                
                // Update global sidebar avatar and name
                if (this.app.authController && this.app.authController.updateUserProfile) {
                    this.app.authController.updateUserProfile();
                }
                
                // Force a full refresh of the social network feed and members list
                await this.app.navigate('social-network');
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("No se pudo guardar el perfil.");
            const btn = document.querySelector('#profile-edit-card .btn-primary');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Guardar Cambios';
            }
        }
    }

    destroy() {
        if (this.unsubscribePosts) {
            this.unsubscribePosts();
            this.unsubscribePosts = null;
        }
    }

    compressImage(dataUrl, maxWidth, quality) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.src = dataUrl;
        });
    }
}
