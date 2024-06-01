// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHhIk-KvgaZnMoFjsFGaEuljvY5J8yMTY",
    authDomain: "round-ring-356205.firebaseapp.com",
    projectId: "round-ring-356205",
    storageBucket: "round-ring-356205.appspot.com",
    messagingSenderId: "273982037415",
    appId: "1:273982037415:web:2ab1ffbd1c844b2dc06a82"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const loginContainer = document.querySelector('.login-container');
const chatContainer = document.querySelector('.chat-container');
const loginButton = document.getElementById('loginButton');
const sendButton = document.getElementById('sendButton');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const messageInput = document.getElementById('messageInput');
const messagesList = document.getElementById('messages');
const userList = document.getElementById('userList');
const imageUpload = document.getElementById('imageUpload');
const loginMessage = document.getElementById('loginMessage');

// Imgur API
const IMGUR_CLIENT_ID = 'YOUR_IMGUR_CLIENT_ID';

// Sign in function
loginButton.addEventListener('click', () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    auth.signInWithEmailAndPassword(username, password)
        .then(() => {
            loginContainer.classList.remove('active');
            chatContainer.classList.add('active');
            loadMessages();
            loadUsers();
        })
        .catch(error => {
            loginMessage.textContent = error.message;
        });
});

// Load messages
function loadMessages() {
    db.collection('messages').orderBy('timestamp').onSnapshot(snapshot => {
        messagesList.innerHTML = '';
        snapshot.forEach(doc => {
            const message = doc.data();
            const li = document.createElement('li');
            li.textContent = `${message.username}: ${message.text}`;
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
    db.collection('users').onSnapshot(snapshot => {
        userList.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            const div = document.createElement('div');
            div.textContent = user.username;
            userList.appendChild(div);
        });
    });
}

// Send message
sendButton.addEventListener('click', async () => {
    const text = messageInput.value;
    const user = auth.currentUser;
    let imageUrl = '';

    if (imageUpload.files.length > 0) {
        const file = imageUpload.files[0];
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('https://api.imgur.com/3/image', formData, {
            headers: {
                Authorization: `072582e92f000a9 ${IMGUR_CLIENT_ID}`
            }
        });

        imageUrl = response.data.data.link;
    }

    db.collection('messages').add({
        text: text,
        username: user.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        imageUrl: imageUrl
    });

    messageInput.value = '';
    imageUpload.value = '';
});

// Authentication state observer
auth.onAuthStateChanged(user => {
    if (user) {
        loginContainer.classList.remove('active');
        chatContainer.classList.add('active');
        loadMessages();
        loadUsers();
    } else {
        loginContainer.classList.add('active');
        chatContainer.classList.remove('active');
    }
});
