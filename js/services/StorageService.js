import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, updateDoc, 
    doc, onSnapshot, setDoc, query, where, orderBy, deleteDoc, 
    getDoc, arrayUnion, arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { 
    getStorage, ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDCbp5FPjn5mQU2WydHiYOZ5JyyHLx-fwQ",
    authDomain: "web-cooperativa-f5ed7.firebaseapp.com",
    projectId: "web-cooperativa-f5ed7",
    storageBucket: "web-cooperativa-f5ed7.firebasestorage.app",
    messagingSenderId: "32369715198",
    appId: "1:32369715198:web:e04802c244c7e538e9c2af"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export class StorageService {
    constructor() {
        this.db = db;
        this.storage = storage;
    }

    async getStudents() {
        const snapshot = await getDocs(collection(this.db, 'students'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getTutors() {
        const snapshot = await getDocs(collection(this.db, 'tutors'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getAdmins() {
        const snapshot = await getDocs(collection(this.db, 'admins'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getAllUsers() {
        const snapshot = await getDocs(collection(this.db, 'usuarios'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getUserByUsername(username) {
        const qEmail = query(collection(this.db, 'usuarios'), where('email', '==', username));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
            return { id: snapEmail.docs[0].id, ...snapEmail.docs[0].data() };
        }
        const qName = query(collection(this.db, 'usuarios'), where('name', '==', username));
        const snapName = await getDocs(qName);
        if (!snapName.empty) {
            return { id: snapName.docs[0].id, ...snapName.docs[0].data() };
        }
        return null;
    }

    async updateStudent(student) {
        await updateDoc(doc(this.db, 'students', student.id), student);
        await updateDoc(doc(this.db, 'usuarios', student.id), student);
    }

    async addStudent(student) {
        const id = student.id || `student_${Date.now()}`;
        student.id = id;
        await setDoc(doc(this.db, 'students', id), student);
        await setDoc(doc(this.db, 'usuarios', id), student);
    }

    async saveUser(user, role) {
        if (!user.id) user.id = `${role}_${Date.now()}`;
        const id = user.id;

        if (role === 'student') await setDoc(doc(this.db, 'students', id), user);
        else if (role === 'tutor') await setDoc(doc(this.db, 'tutors', id), user);
        else if (role === 'admin') await setDoc(doc(this.db, 'admins', id), user);

        await setDoc(doc(this.db, 'usuarios', id), user);
    }

    async updateUserProfile(userId, profileData) {
        // Fetch current user logic since it can be any role.
        const userDoc = await getDoc(doc(this.db, 'usuarios', userId));
        if (userDoc.exists()) {
            const role = userDoc.data().role;
            if (role === 'student') await updateDoc(doc(this.db, 'students', userId), profileData);
            else if (role === 'tutor') await updateDoc(doc(this.db, 'tutors', userId), profileData);
            else if (role === 'admin') await updateDoc(doc(this.db, 'admins', userId), profileData);
        }
        await updateDoc(doc(this.db, 'usuarios', userId), profileData);
        
        // Return updated user
        const updatedDoc = await getDoc(doc(this.db, 'usuarios', userId));
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    // --- GLOBAL CHAT SYSTEM ---
    async addGlobalMessage(msgData) {
        const id = 'gmsg_' + Date.now();
        msgData.id = id;
        await setDoc(doc(this.db, 'globalMessages', id), msgData);
    }

    async subscribeToGlobalMessages(callback) {
        const q = query(collection(this.db, 'globalMessages'), orderBy('timestamp', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(msgs);
        });
    }

    async getChatMessages(studentId, tutorId) {
        const q = query(collection(this.db, 'messages'), where('studentId', '==', studentId), where('tutorId', '==', tutorId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    async subscribeToChatMessages(studentId, tutorId, callback) {
        const q = query(collection(this.db, 'messages'), where('studentId', '==', studentId), where('tutorId', '==', tutorId));
        return onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
            callback(msgs);
        });
    }

    async addChatMessage(msg) {
        const id = 'msg_' + Date.now() + Math.random().toString(36).substr(2, 5);
        msg.id = id;
        await setDoc(doc(this.db, 'messages', id), msg);
    }

    async getMeetings() {
        const snapshot = await getDocs(collection(this.db, 'meetings'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // --- ALERTS SYSTEM ---

    async sendAlert(alertData) {
        const id = 'alert_' + Date.now();
        const data = {
            ...alertData,
            id: id,
            fecha: new Date().toISOString(),
            vistoPor: [],
            borradoPor: []
        };
        await setDoc(doc(this.db, 'alertas', id), data);
    }

    async subscribeToTutorAlerts(tutorId, callback) {
        const q = query(collection(this.db, 'alertas'), where('tutorId', '==', tutorId));
        return onSnapshot(q, (snapshot) => {
            let alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            alerts = alerts.filter(a => !a.borradoPor || !a.borradoPor.includes(tutorId));
            alerts.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            callback(alerts);
        });
    }

    async subscribeToStudentAlerts(studentId, assignedTutorId, callback) {
        const q = query(collection(this.db, 'alertas'), where('tutorId', '==', assignedTutorId));
        return onSnapshot(q, (snapshot) => {
            let alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            alerts = alerts.filter(a => {
                if (a.borradoPor && a.borradoPor.includes(studentId)) return false;
                if (a.destinatarios === 'TODOS') return true;
                if (Array.isArray(a.destinatarios) && a.destinatarios.includes(studentId)) return true;
                return false;
            });
            alerts.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            callback(alerts);
        });
    }

    async deleteAlert(alertId, userId, forEveryone = false) {
        if (forEveryone) {
            await deleteDoc(doc(this.db, 'alertas', alertId));
        } else {
            await updateDoc(doc(this.db, 'alertas', alertId), {
                borradoPor: arrayUnion(userId)
            });
        }
    }

    async markAlertAsSeen(alertId, studentId) {
        await updateDoc(doc(this.db, 'alertas', alertId), {
            vistoPor: arrayUnion(studentId)
        });
    }

    // --- SOCIAL NETWORK SYSTEM ---

    async addPost(postData) {
        const id = 'post_' + Date.now();
        const pData = { 
            id, 
            authorId: postData.authorId, 
            content: postData.content, 
            imageUrl: postData.imageUrl || null, 
            timestamp: postData.timestamp,
            likes: [],
            comments: []
        };
        await setDoc(doc(this.db, 'posts', id), pData);
    }

    async subscribeToPosts(callback) {
        const q = query(collection(this.db, 'posts'), orderBy('timestamp', 'desc'));
        return onSnapshot(q, async (snapshot) => {
            let postArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            postArray = await this._hydratePosts(postArray);
            callback(postArray);
        });
    }

    async _hydratePosts(postArray) {
        if (postArray.length === 0) return postArray;
        
        const usersSnap = await getDocs(collection(this.db, 'usuarios'));
        const usersMap = {};
        usersSnap.forEach(doc => {
            usersMap[doc.id] = doc.data();
        });

        return postArray.map(post => {
            const author = usersMap[post.authorId];
            if (author) {
                post.authorName = author.name || author.email;
                post.authorAvatarBase64 = author.avatarBase64 || null;
                post.authorRole = author.role;
            } else {
                post.authorName = 'Usuario Desconocido';
                post.authorAvatarBase64 = null;
                post.authorRole = 'student';
            }

            if (post.comments) {
                post.comments = post.comments.map(comment => {
                    const cAuthor = usersMap[comment.authorId];
                    if (cAuthor) {
                        comment.authorName = cAuthor.name || cAuthor.email;
                        comment.authorAvatarBase64 = cAuthor.avatarBase64 || null;
                        comment.authorRole = cAuthor.role;
                    } else {
                        comment.authorName = 'Usuario Desconocido';
                        comment.authorAvatarBase64 = null;
                        comment.authorRole = 'student';
                    }
                    return comment;
                });
            }
            return post;
        });
    }

    async togglePostLike(postId, userId) {
        const postRef = doc(this.db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const post = postSnap.data();
            const likes = post.likes || [];
            if (likes.includes(userId)) {
                await updateDoc(postRef, { likes: arrayRemove(userId) });
            } else {
                await updateDoc(postRef, { likes: arrayUnion(userId) });
            }
        }
    }

    async addCommentToPost(postId, commentData) {
        const postRef = doc(this.db, 'posts', postId);
        const comment = { 
            id: 'comment_' + Date.now(), 
            authorId: commentData.authorId,
            content: commentData.content,
            timestamp: commentData.timestamp
        };
        await updateDoc(postRef, {
            comments: arrayUnion(comment)
        });
    }

    async getPostById(postId) {
        const postSnap = await getDoc(doc(this.db, 'posts', postId));
        if (!postSnap.exists()) return null;
        const hydrated = await this._hydratePosts([{ id: postSnap.id, ...postSnap.data() }]);
        return hydrated[0];
    }

    // --- FORUM SYSTEM ---

    async subscribeToForumTopics(callback) {
        const q = query(collection(this.db, 'forum_topics'), orderBy('lastActivity', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(topics);
        });
    }

    async getForumTopic(topicId) {
        const topicSnap = await getDoc(doc(this.db, 'forum_topics', topicId));
        return topicSnap.exists() ? { id: topicSnap.id, ...topicSnap.data() } : null;
    }

    async createForumTopic(topicData) {
        const id = 'topic_' + Date.now();
        const data = {
            id,
            ...topicData,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            replyCount: 0
        };
        await setDoc(doc(this.db, 'forum_topics', id), data);
    }

    async subscribeToForumMessages(topicId, callback) {
        const q = query(collection(this.db, 'forum_messages'), where('topicId', '==', topicId));
        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            callback(messages);
        }, (error) => {
            console.error("Error subscribing to forum messages:", error);
        });
    }

    async createForumMessage(messageData) {
        const id = 'fmsg_' + Date.now();
        const data = {
            id,
            ...messageData,
            createdAt: new Date().toISOString()
        };
        await setDoc(doc(this.db, 'forum_messages', id), data);

        // Update topic's last activity and reply count
        const topicRef = doc(this.db, 'forum_topics', messageData.topicId);
        const topicSnap = await getDoc(topicRef);
        if (topicSnap.exists()) {
            const count = (topicSnap.data().replyCount || 0) + 1;
            await updateDoc(topicRef, {
                lastActivity: data.createdAt,
                replyCount: count
            });
        }
    }

    // --- DRIVE SYSTEM ---

    async uploadDriveFile(file) {
        const uniqueName = Date.now() + '_' + file.name;
        const storageRef = ref(this.storage, 'drive_files/' + uniqueName);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    }

    async getDriveItemsByParent(parentId) {
        const q = query(collection(this.db, 'drive_items'), where('parentId', '==', parentId));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort locally to avoid Firebase index requirement
    }

    async createDriveItem(itemData) {
        const data = {
            ...itemData,
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(this.db, 'drive_items'), data);
        return docRef.id;
    }
}
