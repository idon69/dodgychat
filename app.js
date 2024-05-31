// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHhIk-KvgaZnMoFjsFGaEuljvY5J8yMTY",
    authDomain: "round-ring-356205.firebaseapp.com",
    projectId: "round-ring-356205",
    storageBucket: "round-ring-356205.appspot.com",
    messagingSenderId: "273982037415",
    appId: "1:273982037415:web:2ab1ffbd1c844b2dc06a82"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const loginContainer = document.querySelector('.login-container');
const chatContainer = document.querySelector('.chat-container');
const loginButton = document.getElementById('loginButton');
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');
const imageUpload = document.getElementById('imageUpload');
const messagesList = document.getElementById('messages');
const userList = document.getElementById('userList');
const loginMessage = document.getElementById('loginMessage');

let currentUser;

// Handle login
loginButton.addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(username, password)
        .then(userCredential => {
            currentUser = userCredential.user;
            return db.collection('users').doc(currentUser.uid).set({
                username: username,
                uid: currentUser.uid
            }, { merge: true });
        })
        .then(() => {
            loginContainer.classList.remove('active');
            chatContainer.classList.add('active');
            loadMessages();
            loadUsers();
        })
        .catch(error => {
            console.error(error);
            loginMessage.textContent = "Login failed: " + error.message;
        });
});

// Handle sending message
sendButton.addEventListener('click', async () => {
    const text = messageInput.value;
    const file = imageUpload.files[0];

    let imageUrl = "";
    if (file) {
        imageUrl = await uploadImage(file);
    }

    if (text || imageUrl) {
        await db.collection('messages').add({
            text: text,
            imageUrl: imageUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uid: currentUser.uid
        });
        messageInput.value = '';
        imageUpload.value = '';
    }
});

// Load messages
function loadMessages() {
    db.collection('messages').orderBy('createdAt').onSnapshot(snapshot => {
        messagesList.innerHTML = '';
        snapshot.forEach(doc => {
            const message = doc.data();
            const li = document.createElement('li');
            li.textContent = message.text;
            if (message.imageUrl) {
                const img = document.createElement('img');
                img.src = message.imageUrl;
                li.appendChild(img);
            }
            messagesList.appendChild(li);
        });
    });
}

// Load users
function loadUsers() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            db.collection('users').onSnapshot(snapshot => {
                userList.innerHTML = 'Online users:<br>';
                snapshot.forEach(doc => {
                    const user = doc.data();
                    userList.innerHTML += user.username + '<br>';
                });
            });
        } else {
            console.log("No user is signed in.");
        }
    });
}

// Upload image to Imgur
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await axios.post('https://api.imgur.com/3/image', formData, {
            headers: {
                Authorization: '072582e92f000a9'
            }
        });
        return response.data.data.link;
    } catch (error) {
        console.error("Image upload failed:", error);
        return "";
    }
}
