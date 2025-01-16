const socket = io();
document.getElementById('fileInput').onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const message = e.target.result; // Base64 da imagem
        const recipientId = document.querySelector('input[name="recipient"]:checked')?.value;
        socket.emit('sendMessage', message, recipientId);
    };
    reader.readAsDataURL(file);
};

socket.on('receiveMessage', ({ message, username, color }) => {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.style.color = color;

    if (message.startsWith('data:image/')) {
        const img = document.createElement('img');
        img.src = message;
        img.style.maxWidth = '200px'; // Limitar o tamanho da imagem
        messageElement.appendChild(img);
    } else {
        messageElement.textContent = `${username}: ${message}`;
    }

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Rolagem automática para a última mensagem
});

document.getElementById('send').onclick = () => {
    const message = document.getElementById('message').value;
    const recipientId = document.querySelector('input[name="recipient"]:checked')?.value; // Para chat privado
    socket.emit('sendMessage', message, recipientId);
    document.getElementById('message').value = '';
};

document.getElementById('username').onblur = () => {
    const username = document.getElementById('username').value;
    const color = document.getElementById('color').value;
    socket.emit('newUser', username, color);
};

socket.on('updateUser List', (users) => {
    const userList = document.getElementById('user-list');
    const recipientList = document.getElementById('recipient-list');
    userList.innerHTML = '';
    recipientList.innerHTML = '';

    for (const id in users) {
        userList.innerHTML += `<div style="color: ${users[id].color}">${users[id].username}</div>`;
        recipientList.innerHTML += `<input type="radio" name="recipient" value="${id}">${users[id].username}<br>`;
    }
});

socket.on('updateUser List', (users) => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    for (const id in users) {
        userList.innerHTML += `
            <div style="color: ${users[id].color}">
                ${users[id].username} 
                <button onclick="blockUser ('${id}')">Bloquear</button>
            </div>`;
    }
});

function blockUser (userId) {
    socket.emit('blockUser ', userId);
}

socket.on('receiveMessage', ({ message, username, color }) => {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.style.color = color;
    messageElement.textContent = `${username}: ${message}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Rolagem automática para a última mensagem
});