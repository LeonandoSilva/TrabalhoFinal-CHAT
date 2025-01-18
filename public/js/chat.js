const socket = io();

const usernameInput = document.getElementById('username');
const colorInput = document.getElementById('color');
const joinButton = document.getElementById('join-btn');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages');
const usersList = document.getElementById('users');
const toggleSoundButton = document.getElementById('toggle-sound');
const soundIcon = document.getElementById('sound-icon');

// Elementos para chat privado
const privateChatContainer = document.getElementById('private-chat-container');
const privateChatHeader = document.getElementById('private-chat-username');
const privateMessagesContainer = document.getElementById('private-messages');
const privateMessageInput = document.getElementById('private-message-input');
const privateSendButton = document.getElementById('private-send-btn');
const closePrivateChatButton = document.getElementById('close-private-chat-btn');

// Variáveis globais
let soundEnabled = true;
let username = '';
let color = '';
let currentPrivateUserId = null;

// som de notificação
const notificationSound = new Audio('https://www.myinstants.com/media/sounds/discord-notification.mp3');
notificationSound.oncanplaythrough = () => console.log('Som carregado com sucesso!');
notificationSound.onerror = (error) => console.log('Erro ao carregar o som:', error);

// Ligar ou desligar o audio
toggleSoundButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? 'X' : '√';
});

// Configurações iniciais do usuário
joinButton.addEventListener('click', () => {
    username = usernameInput.value;
    color = colorInput.value;
    if (username.trim()) {
        socket.emit('setUsername', { username, color });
        document.getElementById('user-settings').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
    }
});

// Enviar mensagem pública
sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message.trim()) {
        socket.emit('sendMessage', { message });
        messageInput.value = '';
    }
});

// Receber e atualizar a lista de usuários conectados
socket.on('updateUserList', (users) => {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.username;
        li.style.color = user.color;
        li.dataset.userId = user.socketId;

        li.addEventListener('click', () => openPrivateChat(user.username, user.socketId));
        usersList.appendChild(li);
    });
});

// Notificação mensagem privada
socket.on('privateMessageNotification', ({ from }) => {
    const userListItems = document.querySelectorAll('#users li');
    userListItems.forEach((item) => {
        if (item.dataset.userId === from.socketId) {
            //Indicador mensagem nova
            if (!item.querySelector('.notification-dot')) {
                const dot = document.createElement('span');
                dot.className = 'notification-dot';
                dot.style.cssText = `
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    background-color: red;
                    border-radius: 50%;
                    margin-left: 5px;
                `;
                item.appendChild(dot);
            }
        }
    });
});

// Exibição de mensagens públicas ou privadas
socket.on('receiveMessage', ({ message, from, private }) => {
    if (private && from.socketId === currentPrivateUserId) {
        appendMessageToPrivateChat(`${from.username}: ${message}`, from.color);
    } else if (!private) {
        appendMessageToMessages(`${from.username}: ${message}`, from.color);
    }

    if (soundEnabled) notificationSound.play();
});

// Mensagens chat principal
function appendMessageToMessages(content, color) {
    const messageElement = document.createElement('div');
    messageElement.style.color = color;
    messageElement.textContent = content;
    messagesContainer.appendChild(messageElement);
}

// Mensagens chat privado
function appendMessageToPrivateChat(content, color) {
    const messageElement = document.createElement('div');
    messageElement.style.color = color;
    messageElement.textContent = content;
    privateMessagesContainer.appendChild(messageElement);
}

// Abrir o chat privado
function openPrivateChat(username, socketId) {
    currentPrivateUserId = socketId;
    privateChatContainer.style.display = 'block';
    privateChatHeader.textContent = `Chat com ${username}`;

    // Remover indicador de notificação
    const userListItems = document.querySelectorAll('#users li');
    userListItems.forEach((item) => {
        if (item.dataset.userId === socketId) {
            const dot = item.querySelector('.notification-dot');
            if (dot) {
                dot.remove();
            }
        }
    });
}

// Fechar o chat privado
closePrivateChatButton.addEventListener('click', () => {
    privateChatContainer.style.display = 'none';
    currentPrivateUserId = null;
});

// Envio de mensagem privada
privateSendButton.addEventListener('click', () => {
    const privateMessage = privateMessageInput.value;
    if (privateMessage.trim() && currentPrivateUserId) {
        socket.emit('sendMessage', { message: privateMessage, to: currentPrivateUserId });
        appendMessageToPrivateChat(`Você: ${privateMessage}`, color);
        privateMessageInput.value = '';
    }
});

// Envio de imagens
document.getElementById('image-upload-btn').addEventListener('click', () => {
    document.getElementById('image-upload').click();
});

document.getElementById('image-upload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            socket.emit('sendImage', { image: reader.result });
        };
        reader.readAsDataURL(file);
    }
});

// Recebimento de mensagem privada
socket.on('receivePrivateMessage', ({ message, from }) => {
    if (from.socketId === currentPrivateUserId) {
        appendMessageToPrivateChat(`${from.username}: ${message}`, from.color);
    } else {
        if (soundEnabled) notificationSound.play();
    }
});

// Exibição de imagens recebidas
socket.on('receiveImage', ({ image, from }) => {
    appendImageToMessages(image, `${from.username}`);
});

function appendImageToMessages(imageData, from) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${from}:</strong> <img src="${imageData}" style="max-width: 300px; max-height: 300px;">`;
    messagesContainer.appendChild(messageElement);
}

