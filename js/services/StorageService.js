class StorageService {
    constructor() {
        // Create a promise that resolves when init is complete
        this.readyPromise = this.init();
    }

    async init() {
        await this.waitForDb();
        if (!this.db) {
            console.error("Firebase DB not available after waiting.");
            return;
        }

        try {
            // Check if we need to seed
            const snapshot = await this.f.getDocs(this.f.collection(this.db, "students"));
            if (snapshot.empty) {
                console.log("Seeding Firestore with Mock Data...");
                await this.seedData();
            } else {
                console.log("Firestore already has data.");
            }
        } catch (e) {
            console.error("Error checking/seeding data:", e);
        }
    }

    // Ensure all public methods wait for readiness
    async ensureReady() {
        if (this.readyPromise) await this.readyPromise;
        else await this.waitForDb();
    }

    async waitForDb(timeout = 5000) {
        const start = Date.now();
        while ((!window.db || !window.Firestore) && (Date.now() - start < timeout)) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!window.db) console.warn("Waiting for Firebase DB timed out or failed to load module.");
    }

    async seedData() {
        if (typeof MOCK_DATA === 'undefined') return;
        try {
            console.log("Starting seed...");
            // Seed Students
            for (const s of MOCK_DATA.students) {
                await this.addStudent(s);
            }
            // Seed Tutors
            for (const t of MOCK_DATA.tutors) {
                await this.f.setDoc(this.f.doc(this.db, "tutors", t.id), t);
            }
            // Seed Meetings
            for (const m of MOCK_DATA.meetings) {
                await this.f.setDoc(this.f.doc(this.db, "meetings", m.id), m);
            }
            // Seed Chats
            for (const [key, messages] of Object.entries(MOCK_DATA.chats)) {
                const [studentId, tutorId] = key.split('_');
                for (const msg of messages) {
                    await this.addChatMessage({ studentId, tutorId, ...msg });
                }
            }
            console.log("Seeding complete.");
        } catch (e) {
            console.error("Error during seeding:", e);
        }
    }

    get db() { return window.db; }
    get f() { return window.Firestore; }

    async getStudents() {
        await this.ensureReady();
        if (!this.db || !this.f) return [];
        try {
            const querySnapshot = await this.f.getDocs(this.f.collection(this.db, "students"));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error("getStudents error:", e); return []; }
    }

    async getTutors() {
        await this.ensureReady();
        if (!this.db || !this.f) return [];
        try {
            const querySnapshot = await this.f.getDocs(this.f.collection(this.db, "tutors"));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error("getTutors error:", e); return []; }
    }

    async updateStudent(student) {
        await this.ensureReady();
        if (!this.db || !this.f) return;
        try {
            const studentRef = this.f.doc(this.db, "students", student.id);
            const { id, ...data } = student;
            await this.f.setDoc(studentRef, data, { merge: true });
        } catch (e) { console.error("updateStudent error:", e); }
    }

    async addStudent(student) {
        // Internal usage in seedData might bypass ensureReady to avoid deadlock if called from init?
        // But addStudent calls waitForDb.
        // Actually, if addStudent calls ensureReady, and ensureReady awaits readyPromise, and readyPromise is init, and init calls seedData, and seedData calls addStudent... DEADLOCK.

        // Fix: Internal helper or check if running seed?
        // Simpler: waitForDb usage directly for addStudent (write ops usually don't depend on "readiness" of seeding unless we are updating).
        // BUT, concurrent writes might be fine.
        // Let's make addStudent simpler: just wait for DB.

        await this.waitForDb();
        if (!this.db || !this.f) return;
        try {
            if (student.id) {
                const { id, ...data } = student;
                await this.f.setDoc(this.f.doc(this.db, "students", id), data);
            } else {
                await this.f.addDoc(this.f.collection(this.db, "students"), student);
            }
        } catch (e) { console.error("addStudent error:", e); }
    }

    async getAdmins() {
        await this.ensureReady();
        if (!this.db || !this.f) return [];
        try {
            const querySnapshot = await this.f.getDocs(this.f.collection(this.db, "admins"));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error("getAdmins error:", e); return []; }
    }

    async saveUser(user, role) {
        await this.ensureReady();
        if (!this.db || !this.f) return;
        try {
            // Check if ID exists, else generate simplified one if not present
            if (!user.id) user.id = `${role}_${Date.now()}`;

            const { id, ...data } = user;

            // 1. Save to specific collection
            let collectionName = '';
            if (role === 'student') collectionName = 'students';
            else if (role === 'tutor') collectionName = 'tutors';
            else if (role === 'admin') collectionName = 'admins';

            if (collectionName) {
                await this.f.setDoc(this.f.doc(this.db, collectionName, id), data, { merge: true });
            }

            // 2. Save to 'usuarios' collection (Master)
            await this.f.setDoc(this.f.doc(this.db, "usuarios", id), { ...data, id }, { merge: true });

        } catch (e) { console.error("saveUser error:", e); }
    }

    async getChatMessages(studentId, tutorId) {
        await this.ensureReady();
        if (!this.db || !this.f) return [];
        try {
            const q = this.f.query(
                this.f.collection(this.db, "messages"),
                this.f.where("studentId", "==", studentId),
                this.f.where("tutorId", "==", tutorId)
            );
            const snapshot = await this.f.getDocs(q);
            const messages = snapshot.docs.map(doc => doc.data());
            // Sort client-side to avoid needing a Firestore composite index
            messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            return messages;
        } catch (e) {
            console.error("getChatMessages error (indexes might be missing):", e);
            return [];
        }
    }

    async subscribeToChatMessages(studentId, tutorId, callback) {
        await this.ensureReady();
        if (!this.db || !this.f) return () => { };
        try {
            const q = this.f.query(
                this.f.collection(this.db, "messages"),
                this.f.where("studentId", "==", studentId),
                this.f.where("tutorId", "==", tutorId)
            );

            return this.f.onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map(doc => doc.data());
                messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                callback(messages);
            });
        } catch (e) {
            console.error("subscribeToChatMessages error:", e);
            return () => { };
        }
    }

    async addChatMessage(msg) {
        await this.waitForDb(); // Writing doesn't strictly need to wait for seed completion
        if (!this.db || !this.f) return;
        try {
            await this.f.addDoc(this.f.collection(this.db, "messages"), msg);
        } catch (e) { console.error("addChatMessage error:", e); }
    }

    async getMeetings() {
        await this.ensureReady();
        if (!this.db || !this.f) return [];
        try {
            const querySnapshot = await this.f.getDocs(this.f.collection(this.db, "meetings"));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error("getMeetings error:", e); return []; }
    }

    // --- ALERTS SYSTEM ---

    async sendAlert(alertData) {
        await this.ensureReady();
        if (!this.db || !this.f) return;
        try {
            await this.f.addDoc(this.f.collection(this.db, "alertas"), {
                ...alertData,
                fecha: new Date().toISOString(), // Use string ISO for simplicity in querying
                vistoPor: []
            });
        } catch (e) { console.error("sendAlert error:", e); throw e; }
    }

    async subscribeToTutorAlerts(tutorId, callback) {
        await this.ensureReady();
        try {
            const q = this.f.query(
                this.f.collection(this.db, "alertas"),
                this.f.where("tutorId", "==", tutorId)
            );
            return this.f.onSnapshot(q, (snapshot) => {
                const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort by date desc
                alerts.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                callback(alerts);
            });
        } catch (e) { console.error("subscribeToTutorAlerts error:", e); return () => { }; }
    }

    async subscribeToStudentAlerts(studentId, assignedTutorId, callback) {
        await this.ensureReady();
        try {
            // Subscribe to "TODOS" from my tutor OR specific to me
            // Firestore OR check is tricky in one query if fields differ.
            // Client side filtering is easier for this scale.

            // We listen to ALL alerts from my tutor (efficient enough for small scale)
            const q = this.f.query(
                this.f.collection(this.db, "alertas"),
                this.f.where("tutorId", "==", assignedTutorId)
            );

            return this.f.onSnapshot(q, (snapshot) => {
                let alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Filter client side: Destinatario is 'TODOS' OR includes studentId
                alerts = alerts.filter(a => {
                    if (a.destinatarios === 'TODOS') return true;
                    if (Array.isArray(a.destinatarios) && a.destinatarios.includes(studentId)) return true;
                    return false;
                });

                // Filter out if already seen? Maybe we still want to show them in a history, 
                // but requirement implies "until closed". 
                // We will pass all relevant alerts to controller, controller decides what to show active.

                alerts.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                callback(alerts);
            });
        } catch (e) { console.error("subscribeToStudentAlerts error:", e); return () => { }; }
    }
    async getTutors() {
        await this.ensureReady();
        if (!this.db || !this.f) return [];
        try {
            const querySnapshot = await this.f.getDocs(this.f.collection(this.db, "tutors"));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error("getTutors error:", e); return []; }
    }

    async updateStudent(student) {
        await this.ensureReady();
        if (!this.db || !this.f) return;
        try {
            const studentRef = this.f.doc(this.db, "students", student.id);
            const { id, ...data } = student;
            await this.f.setDoc(studentRef, data, { merge: true });
        } catch (e) { console.error("updateStudent error:", e); }
    }

    async addStudent(student) {
        // Internal usage in seedData might bypass ensureReady to avoid deadlock if called from init?
        // But addStudent calls waitForDb.
        // Actually, if addStudent calls ensureReady, and ensureReady awaits readyPromise, and readyPromise is init, and init calls seedData, and seedData calls addStudent... DEADLOCK.

        // Fix: Internal helper or check if running seed?
        // Simpler: waitForDb usage directly for addStudent (write ops usually don't depend on "readiness" of seeding unless we are updating).
        // BUT, concurrent writes might be fine.
        // Let's make addStudent simpler: just wait for DB.

        await this.waitForDb();
        if (!this.db || !this.f) return;
        try {
            if (student.id) {
                const { id, ...data } = student;
                await this.f.setDoc(this.f.doc(this.db, "students", id), data);
            } else {
                await this.f.addDoc(this.f.collection(this.db, "students"), student);
            }
        } catch (e) { console.error("addStudent error:", e); }
    }

    async getAdmins() {
        await this.ensureReady();
        if (!this.db || !this.f) return [];
        try {
            const querySnapshot = await this.f.getDocs(this.f.collection(this.db, "admins"));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error("getAdmins error:", e); return []; }
    }

    async saveUser(user, role) {
        await this.ensureReady();
        if (!this.db || !this.f) return;
        try {
            // Check if ID exists, else generate simplified one if not present
            if (!user.id) user.id = `${role}_${Date.now()}`;

            const { id, ...data } = user;

            // 1. Save to specific collection
            let collectionName = '';
            if (role === 'student') collectionName = 'students';
            else if (role === 'tutor') collectionName = 'tutors';
            else if (role === 'admin') collectionName = 'admins';

            if (collectionName) {
                await this.f.setDoc(this.f.doc(this.db, collectionName, id), data, { merge: true });
            }

            // 2. Save to 'usuarios' collection (Master)
            await this.f.setDoc(this.f.doc(this.db, "usuarios", id), { ...data, id }, { merge: true });

        } catch (e) { console.error("saveUser error:", e); }
    }

    async getChatMessages(studentId, tutorId) {
        await this.ensureReady();
        if (!this.db || !this.f) return [];
        try {
            const q = this.f.query(
                this.f.collection(this.db, "messages"),
                this.f.where("studentId", "==", studentId),
                this.f.where("tutorId", "==", tutorId)
            );
            const snapshot = await this.f.getDocs(q);
            const messages = snapshot.docs.map(doc => doc.data());
            // Sort client-side to avoid needing a Firestore composite index
            messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            return messages;
        } catch (e) {
            console.error("getChatMessages error (indexes might be missing):", e);
            return [];
        }
    }

    async subscribeToChatMessages(studentId, tutorId, callback) {
        await this.ensureReady();
        if (!this.db || !this.f) return () => { };
        try {
            const q = this.f.query(
                this.f.collection(this.db, "messages"),
                this.f.where("studentId", "==", studentId),
                this.f.where("tutorId", "==", tutorId)
            );

            return this.f.onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map(doc => doc.data());
                messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                callback(messages);
            });
        } catch (e) {
            console.error("subscribeToChatMessages error:", e);
            return () => { };
        }
    }

    async addChatMessage(msg) {
        await this.waitForDb(); // Writing doesn't strictly need to wait for seed completion
        if (!this.db || !this.f) return;
        try {
            await this.f.addDoc(this.f.collection(this.db, "messages"), msg);
        } catch (e) { console.error("addChatMessage error:", e); }
    }

    async getMeetings() {
        await this.ensureReady();
        if (!this.db || !this.f) return [];
        try {
            const querySnapshot = await this.f.getDocs(this.f.collection(this.db, "meetings"));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error("getMeetings error:", e); return []; }
    }

    // --- ALERTS SYSTEM ---

    async sendAlert(alertData) {
        await this.ensureReady();
        if (!this.db || !this.f) return;
        try {
            await this.f.addDoc(this.f.collection(this.db, "alertas"), {
                ...alertData,
                fecha: new Date().toISOString(), // Use string ISO for simplicity in querying
                vistoPor: []
            });
        } catch (e) { console.error("sendAlert error:", e); throw e; }
    }

    async subscribeToTutorAlerts(tutorId, callback) {
        await this.ensureReady();
        try {
            const q = this.f.query(
                this.f.collection(this.db, "alertas"),
                this.f.where("tutorId", "==", tutorId)
            );
            return this.f.onSnapshot(q, (snapshot) => {
                let alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Filter out if deleted by me
                alerts = alerts.filter(a => !a.borradoPor || !a.borradoPor.includes(tutorId));

                // Sort by date desc
                alerts.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                callback(alerts);
            });
        } catch (e) { console.error("subscribeToTutorAlerts error:", e); return () => { }; }
    }

    async subscribeToStudentAlerts(studentId, assignedTutorId, callback) {
        await this.ensureReady();
        try {
            // Subscribe to "TODOS" from my tutor OR specific to me
            // Firestore OR check is tricky in one query if fields differ.
            // Client side filtering is easier for this scale.

            // We listen to ALL alerts from my tutor (efficient enough for small scale)
            const q = this.f.query(
                this.f.collection(this.db, "alertas"),
                this.f.where("tutorId", "==", assignedTutorId)
            );

            return this.f.onSnapshot(q, (snapshot) => {
                let alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Filter client side: Destinatario is 'TODOS' OR includes studentId
                alerts = alerts.filter(a => {
                    if (a.borradoPor && a.borradoPor.includes(studentId)) return false; // Deleted by me

                    if (a.destinatarios === 'TODOS') return true;
                    if (Array.isArray(a.destinatarios) && a.destinatarios.includes(studentId)) return true;
                    return false;
                });

                alerts.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                callback(alerts);
            });
        } catch (e) { console.error("subscribeToStudentAlerts error:", e); return () => { }; }
    }

    async deleteAlert(alertId, userId, forEveryone = false) {
        await this.ensureReady();
        try {
            const alertRef = this.f.doc(this.db, "alertas", alertId);

            if (forEveryone) {
                // Delete the document entirely
                await this.f.deleteDoc(alertRef);
            } else {
                // Mark as deleted for this user
                await this.f.updateDoc(alertRef, {
                    borradoPor: this.f.arrayUnion(userId)
                });
            }
        } catch (e) { console.error("deleteAlert error:", e); throw e; }
    }

    async markAlertAsSeen(alertId, studentId) {
        await this.ensureReady();
        try {
            const alertRef = this.f.doc(this.db, "alertas", alertId);
            await this.f.updateDoc(alertRef, {
                vistoPor: this.f.arrayUnion(studentId)
            });
        } catch (e) { console.error("markAlertAsSeen error:", e); }
    }

    // --- FORUM SYSTEM ---

    async subscribeToForumTopics(callback) {
        await this.ensureReady();
        if (!this.db || !this.f) return () => {};
        try {
            const q = this.f.query(
                this.f.collection(this.db, "forum_topics"),
                this.f.orderBy("createdAt", "desc")
            );
            return this.f.onSnapshot(q, (snapshot) => {
                const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Fallback sort client-side in case index doesn't kick in instantly
                topics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                callback(topics);
            });
        } catch (e) {
            console.error("subscribeToForumTopics error:", e);
            // Fallback without orderBy if index is missing
            try {
                const fbakQ = this.f.query(this.f.collection(this.db, "forum_topics"));
                return this.f.onSnapshot(fbakQ, (snapshot) => {
                    const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    topics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    callback(topics);
                });
            } catch(e2) { return () => {}; }
        }
    }

    async createForumTopic(topicData) {
        await this.ensureReady();
        if (!this.db || !this.f) return;
        try {
            await this.f.addDoc(this.f.collection(this.db, "forum_topics"), {
                ...topicData,
                createdAt: new Date().toISOString(),
                replyCount: 0
            });
        } catch (e) { console.error("createForumTopic error:", e); throw e; }
    }

    async getForumTopic(topicId) {
        await this.ensureReady();
        if (!this.db || !this.f) return null;
        try {
            const docRef = this.f.doc(this.db, "forum_topics", topicId);
            const docSnap = await this.f.getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (e) { console.error("getForumTopic error:", e); return null; }
    }

    async subscribeToForumMessages(topicId, callback) {
        await this.ensureReady();
        if (!this.db || !this.f) return () => {};
        try {
            const q = this.f.query(
                this.f.collection(this.db, "forum_messages"),
                this.f.where("topicId", "==", topicId)
            );
            
            return this.f.onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort client-side
                messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                callback(messages);
            });
        } catch (e) { console.error("subscribeToForumMessages error:", e); return () => {}; }
    }

    async createForumMessage(messageData) {
        await this.ensureReady();
        if (!this.db || !this.f) return;
        try {
            await this.f.addDoc(this.f.collection(this.db, "forum_messages"), {
                ...messageData,
                createdAt: new Date().toISOString()
            });

            // Update topic reply count and lastActivity
            if (messageData.topicId) {
                const topicRef = this.f.doc(this.db, "forum_topics", messageData.topicId);
                const topicSnap = await this.f.getDoc(topicRef);
                if (topicSnap.exists()) {
                    const currentReplies = topicSnap.data().replyCount || 0;
                    await this.f.updateDoc(topicRef, {
                        replyCount: currentReplies + 1,
                        lastActivity: new Date().toISOString()
                    });
                }
            }
        } catch (e) { console.error("createForumMessage error:", e); throw e; }
    }
}
