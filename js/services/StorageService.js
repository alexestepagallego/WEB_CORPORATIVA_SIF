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

    async saveUser(user, role) {
        if (!user.id) user.id = `user_${Date.now()}`;
        const id = user.id;

        await setDoc(doc(this.db, 'usuarios', id), user);
    }

    async updateUserProfile(userId, profileData) {
        await updateDoc(doc(this.db, 'usuarios', userId), profileData);
        
        // Return updated user
        const updatedDoc = await getDoc(doc(this.db, 'usuarios', userId));
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    async updateUserRole(userId, newRole) {
        await updateDoc(doc(this.db, 'usuarios', userId), { role: newRole });
    }

    async deleteUser(userId) {
        await deleteDoc(doc(this.db, 'usuarios', userId));
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

    async deleteChatMessage(id) {
        await deleteDoc(doc(this.db, 'globalMessages', id));
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
                post.authorRole = 'employee';
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
                        comment.authorRole = 'employee';
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

    async deletePost(id) {
        await deleteDoc(doc(this.db, 'posts', id));
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

    async deleteForumTopic(topicId) {
        // Delete all messages associated with this topic first
        const msgsQuery = query(collection(this.db, 'forum_messages'), where('topicId', '==', topicId));
        const msgsSnap = await getDocs(msgsQuery);
        const deletePromises = msgsSnap.docs.map(mDoc => deleteDoc(doc(this.db, 'forum_messages', mDoc.id)));
        await Promise.all(deletePromises);

        // Delete the topic itself
        await deleteDoc(doc(this.db, 'forum_topics', topicId));
    }

    async deleteForumMessage(messageId) {
        await deleteDoc(doc(this.db, 'forum_messages', messageId));
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

    // --- BOOKMARKS SYSTEM ---

    async getBookmarks(userId) {
        const q = query(collection(this.db, 'bookmarks'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const bookmarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort locally by creation date descending
        return bookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async addBookmark(bookmarkData) {
        const data = {
            ...bookmarkData,
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(this.db, 'bookmarks'), data);
        return docRef.id;
    }

    async updateBookmark(bookmarkId, bookmarkData) {
        await updateDoc(doc(this.db, 'bookmarks', bookmarkId), bookmarkData);
    }

    async deleteBookmark(bookmarkId) {
        await deleteDoc(doc(this.db, 'bookmarks', bookmarkId));
    }
}
