class AdminController {
    constructor(app) {
        this.app = app;
        this.activeTab = 'students'; // 'students' or 'tutors'
    }

    async renderDashboard(container, actionsContainer) {
        this.container = container;
        this.actionsContainer = actionsContainer;
        await this.ensureDataIntegrity(); // Auto-migrate old data
        await this.refreshView();
    }

    async ensureDataIntegrity() {
        // Fix for existing data that might lack the new fields
        let students = await this.app.db.getStudents();
        let tutors = await this.app.db.getTutors();
        let changed = false;

        const specialties = ['Desarrollo Web', 'IA', 'Ciberseguridad'];

        for (let s of students) {
            if (!s.studyType) {
                s.studyType = specialties[Math.floor(Math.random() * specialties.length)];
                await this.app.db.updateStudent(s);
                changed = true;
            }
        }

        for (let t of tutors) {
            let tChanged = false;
            if (!t.specialty) {
                t.specialty = specialties[Math.floor(Math.random() * specialties.length)];
                tChanged = true;
            }
            if (!t.maxQuota) {
                t.maxQuota = 5;
                tChanged = true;
            }
            if (tChanged) {
                await this.app.db.saveUser(t, 'tutor');
                changed = true;
            }
        }
    }

    async refreshView() {
        const students = await this.app.db.getStudents();
        const tutors = await this.app.db.getTutors();

        // Calculate Tutor Loads
        tutors.forEach(t => {
            t.currentLoad = students.filter(s => s.assignedTutorId === t.id).length;
        });

        // 1. Header Actions
        this.actionsContainer.innerHTML = '';

        const autoAssignBtn = document.createElement('button');
        autoAssignBtn.className = 'btn btn-primary';
        autoAssignBtn.textContent = 'Ejecutar Asignación Automática';
        autoAssignBtn.onclick = () => this.handleAutoAssign();

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-outline';
        resetBtn.style.marginLeft = '10px';
        resetBtn.style.color = 'var(--danger)';
        resetBtn.style.borderColor = 'var(--danger)';
        resetBtn.textContent = 'Reiniciar Asignaciones';
        resetBtn.onclick = () => this.handleResetAssignments();

        this.actionsContainer.appendChild(autoAssignBtn);
        this.actionsContainer.appendChild(resetBtn);

        // 2. Dashboard Stats
        const totalStudents = students.length;
        const unassignedStudents = students.filter(s => s.status === 'unassigned').length;
        const totalTutors = tutors.length;
        // Count total slots
        const totalSlots = tutors.reduce((acc, t) => acc + (t.maxQuota || 0), 0);
        const usedSlots = tutors.reduce((acc, t) => acc + t.currentLoad, 0);

        let html = `
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:1rem; margin-bottom:2rem;">
                <div style="background:white; padding:1.5rem; border-radius:0.5rem; box-shadow:var(--shadow);">
                    <div style="color:var(--text-muted); font-size:0.875rem;">Total Alumnos</div>
                    <div style="font-size:2rem; font-weight:bold; color:var(--primary);">${totalStudents}</div>
                </div>
                <div style="background:white; padding:1.5rem; border-radius:0.5rem; box-shadow:var(--shadow);">
                    <div style="color:var(--text-muted); font-size:0.875rem;">Sin Asignar</div>
                    <div style="font-size:2rem; font-weight:bold; color:var(--danger);">${unassignedStudents}</div>
                </div>
                <div style="background:white; padding:1.5rem; border-radius:0.5rem; box-shadow:var(--shadow);">
                    <div style="color:var(--text-muted); font-size:0.875rem;">Tutores</div>
                    <div style="font-size:2rem; font-weight:bold; color:var(--primary);">${totalTutors}</div>
                </div>
                <div style="background:white; padding:1.5rem; border-radius:0.5rem; box-shadow:var(--shadow);">
                    <div style="color:var(--text-muted); font-size:0.875rem;">Ocupación Total</div>
                    <div style="font-size:2rem; font-weight:bold; color:var(--text-color);">${usedSlots}/${totalSlots}</div>
                </div>
            </div>
        `;

        // 3. Tabs
        html += `
            <div style="margin-bottom:1rem; border-bottom: 2px solid #eee;">
                <button class="btn btn-outline" style="${this.activeTab === 'students' ? 'background:#e0e7ff; border-color:var(--primary);' : 'border:none;'}" onclick="app.adminController.switchTab('students')">Listado de Alumnos</button>
                <button class="btn btn-outline" style="${this.activeTab === 'tutors' ? 'background:#e0e7ff; border-color:var(--primary);' : 'border:none;'}" onclick="app.adminController.switchTab('tutors')">Listado de Tutores</button>
            </div>
        `;

        // 4. Content Content
        if (this.activeTab === 'students') {
            html += this.renderStudentsTable(students, tutors);
        } else {
            html += this.renderTutorsTable(tutors);
        }

        this.container.innerHTML = html;
    }

    switchTab(tab) {
        this.activeTab = tab;
        this.refreshView();
    }

    renderStudentsTable(students, tutors) {
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Tipo Estudio</th>
                        <th>Estado</th>
                        <th>Tutor Asignado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        students.forEach(student => {
            const tutor = tutors.find(t => t.id === student.assignedTutorId);
            const tutorName = tutor ? tutor.name : '-';
            const statusClass = student.status === 'assigned' ? 'status-assigned' : 'status-unassigned';
            const statusText = student.status === 'assigned' ? 'Asignado' : 'Pendiente';

            html += `
                <tr>
                    <td>${student.name}<br><span style="font-size:0.8em; color:gray;">${student.email}</span></td>
                    <td>${student.studyType || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${tutorName}</td>
                    <td>
                        <button class="btn btn-outline" onclick="app.adminController.openEditModal('${student.id}')" title="Editar">
                            ✏️
                        </button>
                    </td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        return html;
    }

    renderTutorsTable(tutors) {
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Especialidad</th>
                        <th>Carga Actual</th>
                        <th>Estado Cupo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        tutors.forEach(t => {
            const max = t.maxQuota || 0;
            const current = t.currentLoad || 0;
            const isFull = current >= max;
            const statusColor = isFull ? 'var(--danger)' : 'var(--success)';

            html += `
                <tr>
                    <td>${t.name}</td>
                    <td>${t.specialty || 'General'}</td>
                    <td>
                        <div style="font-weight:bold;">${current} / ${max}</div>
                    </td>
                    <td>
                        <span style="color:${statusColor}; font-weight:600;">${isFull ? 'LLENO' : 'Disponible'}</span>
                    </td>
                    <td>
                         <button class="btn btn-outline" onclick="app.adminController.openTutorEditModal('${t.id}')" title="Editar">
                            ✏️
                        </button>
                    </td>
                </tr>
            `;
            // Note: Carga Actual 'currentLoad' was calculated in refreshView
        });
        html += `</tbody></table>`;
        return html;
    }

    async handleAutoAssign() {
        if (!confirm("¿Estás seguro de ejecutar la asignación automática? Esto REASIGNARÁ a todos los alumnos, sobrescribiendo las asignaciones actuales.")) {
            return;
        }

        const students = await this.app.db.getStudents();
        const tutors = await this.app.db.getTutors();

        // 1. Reset all local load tracking to 0 (since we are re-assigning everyone)
        tutors.forEach(t => {
            t.currentLoad = 0;
            // Ensure numbers
            t.maxQuota = t.maxQuota ? parseInt(t.maxQuota) : 5;
        });

        const normalize = (str) => {
            return (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        };

        let assignedCount = 0;
        let pendingStudents = [];

        // 2. Process ALL students (Force Re-assignment)
        // We shuffle randomly to ensure fairness in case of limited slots
        const shuffledStudents = students.sort(() => Math.random() - 0.5);

        for (const student of shuffledStudents) {
            // Reset student status locally before trying to assign
            student.assignedTutorId = null;
            student.status = 'unassigned';

            if (!student.studyType) {
                pendingStudents.push(`${student.name} (Sin especialidad)`);
                // Must persist the reset status
                await this.app.db.updateStudent(student);
                continue;
            }

            const sType = normalize(student.studyType);

            // Filtrado Estricto: Match Especialidad + Hay Hueco
            const candidates = tutors.filter(t => {
                const tSpecialty = normalize(t.specialty);
                const fits = t.currentLoad < t.maxQuota;
                return tSpecialty === sType && fits;
            });

            if (candidates.length > 0) {
                // Step 3: Equidad - choose tutor with LEAST load
                candidates.sort((a, b) => a.currentLoad - b.currentLoad);
                const bestTutor = candidates[0];

                // Step 4: Ejecución
                student.assignedTutorId = bestTutor.id;
                student.status = 'assigned';

                // Update local tracking
                bestTutor.currentLoad++;
                assignedCount++;

                await this.app.db.updateStudent(student);
            } else {
                // Determine REASON for failure for debugging
                const potentialMatches = tutors.filter(t => normalize(t.specialty) === sType);
                if (potentialMatches.length === 0) {
                    pendingStudents.push(`${student.name} (No hay tutores de ${student.studyType})`);
                } else {
                    pendingStudents.push(`${student.name} (Tutores de ${student.studyType} están llenos)`);
                }
                // Persist the reset "unassigned" status
                await this.app.db.updateStudent(student);
            }
        }

        // Step 5: Resumen
        await this.refreshView();

        let msg = `Proceso finalizado.\n${assignedCount} alumnos asignados correctamente.`;
        if (pendingStudents.length > 0) {
            msg += `\n\n${pendingStudents.length} pendientes. Detalles:\n` + pendingStudents.slice(0, 5).map(s => `- ${s}`).join('\n');
            if (pendingStudents.length > 5) msg += `\n... y ${pendingStudents.length - 5} más.`;
        }
        alert(msg);
    }

    async handleResetAssignments() {
        if (!confirm("¿Estás seguro de REINICIAR todas las asignaciones? Todos los alumnos pasarán a estado 'Sin Asignar'.\n\nEsta acción no se puede deshacer.")) {
            return;
        }

        const students = await this.app.db.getStudents();
        let count = 0;

        for (const student of students) {
            if (student.status === 'assigned' || student.assignedTutorId) {
                student.assignedTutorId = null;
                student.status = 'unassigned';
                await this.app.db.updateStudent(student);
                count++;
            }
        }

        await this.refreshView();
        alert(`Se han reiniciado ${count} asignaciones. Ahora puedes ejecutar la asignación automática.`);
    }

    // --- STUDENT EDIT ---
    async openEditModal(studentId) {
        const students = await this.app.db.getStudents();
        const tutors = await this.app.db.getTutors();
        const student = students.find(s => s.id === studentId);

        // Pre-calculate loads for display in dropdown
        tutors.forEach(t => {
            t.currentLoad = students.filter(s => s.assignedTutorId === t.id).length;
        });

        // Use existing specialties for suggestion + default ones
        const defaultSpecialties = ['Ingeniería', 'Medicina', 'Derecho', 'Desarrollo Web', 'IA', 'Ciberseguridad'];
        const existingSpecialties = [...new Set([...tutors.map(t => t.specialty), ...defaultSpecialties])];

        const modalHtml = `
            <div class="modal-overlay" id="edit-modal" onclick="if(event.target === this) app.adminController.closeModal()">
                <div class="modal">
                    <h2>Editar Alumno</h2>
                    <p>Alumno: <strong>${student.name}</strong></p>
                    
                    <div class="form-group">
                        <label>Tipo de Estudio / Especialidad</label>
                         <input type="text" id="student-specialty" class="form-select" value="${student.studyType || ''}" list="specialty-suggestions">
                         <datalist id="specialty-suggestions">
                            ${existingSpecialties.map(s => `<option value="${s}">`).join('')}
                         </datalist>
                    </div>

                    <div class="form-group">
                        <label>Asignar Tutor</label>
                        <select id="tutor-select" class="form-select">
                            <option value="">-- Sin Asignar --</option>
                            ${tutors.map(t => {
            const isMatch = t.specialty === student.studyType;
            const isFull = t.currentLoad >= (t.maxQuota || 5);
            const selected = student.assignedTutorId === t.id ? 'selected' : '';
            const warning = !isMatch ? ' (Difiere especialidad)' : (isFull && t.id !== student.assignedTutorId ? ' (LLENO)' : '');
            return `<option value="${t.id}" ${selected}>${t.name} - ${t.specialty} ${warning}</option>`;
        }).join('')}
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="app.adminController.closeModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.adminController.saveStudentEdit('${studentId}')">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modal-container').innerHTML = modalHtml;
    }

    async saveStudentEdit(studentId) {
        const newTutorId = document.getElementById('tutor-select').value;
        const newSpecialty = document.getElementById('student-specialty').value.trim();

        const students = await this.app.db.getStudents();
        const tutors = await this.app.db.getTutors();
        const student = students.find(s => s.id === studentId);

        if (!student) return;

        if (newTutorId) {
            const tutor = tutors.find(t => t.id === newTutorId);

            // Note: Validation against NEW specialty
            const isMatch = tutor.specialty === newSpecialty;

            // Calculate real-time load again just to be safe
            const currentLoad = students.filter(s => s.assignedTutorId === tutor.id).length;
            const isFull = currentLoad >= (tutor.maxQuota || 5);

            // Warning logic (Override allowed)
            if (!isMatch || isFull) {
                let warnings = [];
                if (!isMatch) warnings.push(`- La especialidad del tutor (${tutor.specialty}) no coincide con la nueva especialidad del alumno (${newSpecialty}).`);
                if (isFull) warnings.push(`- El tutor ya ha alcanzado su cupo máximo (${tutor.maxQuota}).`);

                const proceed = confirm(`Advertencia:\n${warnings.join('\n')}\n\n¿Deseas asignar manualmente de todas formas?`);
                if (!proceed) return;
            }
        }

        // Execute
        student.assignedTutorId = newTutorId || null;
        student.status = newTutorId ? 'assigned' : 'unassigned';
        student.studyType = newSpecialty; // Update specialty

        await this.app.db.updateStudent(student);
        this.closeModal();
        this.refreshView();
    }

    // --- TUTOR EDIT ---
    async openTutorEditModal(tutorId) {
        const tutors = await this.app.db.getTutors();
        const tutor = tutors.find(t => t.id === tutorId);

        // Existing specialties for suggestion + default
        const defaultSpecialties = ['Ingeniería', 'Medicina', 'Derecho', 'Desarrollo Web', 'IA', 'Ciberseguridad'];
        const existingSpecialties = [...new Set([...tutors.map(t => t.specialty), ...defaultSpecialties])];

        const modalHtml = `
            <div class="modal-overlay" id="edit-modal" onclick="if(event.target === this) app.adminController.closeModal()">
                <div class="modal">
                    <h2>Editar Tutor</h2>
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="tutor-name" class="form-select" value="${tutor.name}">
                    </div>
                    <div class="form-group">
                        <label>Especialidad</label>
                        <input type="text" id="tutor-specialty" class="form-select" value="${tutor.specialty || ''}" list="tutor-specialty-suggestions">
                            <datalist id="tutor-specialty-suggestions">
                                ${existingSpecialties.map(s => `<option value="${s}">`).join('')}
                            </datalist>
                    </div>
                    <div class="form-group">
                        <label>Cupo Máximo</label>
                        <input type="number" id="tutor-quota" class="form-select" value="${tutor.maxQuota || 5}" min="1">
                    </div>

                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="app.adminController.closeModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.adminController.saveTutorEdit('${tutorId}')">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modal-container').innerHTML = modalHtml;
    }

    async saveTutorEdit(tutorId) {
        const newName = document.getElementById('tutor-name').value.trim();
        const newSpecialty = document.getElementById('tutor-specialty').value.trim();
        const newQuota = parseInt(document.getElementById('tutor-quota').value);

        if (!newName || !newSpecialty || !newQuota) {
            alert("Todos los campos son obligatorios.");
            return;
        }

        const tutors = await this.app.db.getTutors();
        const tutor = tutors.find(t => t.id === tutorId);

        if (tutor) {
            tutor.name = newName;
            tutor.specialty = newSpecialty;
            tutor.maxQuota = newQuota;

            // Reuse saveUser which handles specific collections + master 'usuarios'
            await this.app.db.saveUser(tutor, 'tutor');

            this.closeModal();
            this.refreshView();
        }
    }

    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    }
}
