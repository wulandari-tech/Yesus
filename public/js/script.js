const socket = io({
    query: {
        username: '<%= username %>'  // Kirim username sebagai query parameter
    }
});


socket.on('chat message', (msg) => {
    const messageElement = document.createElement('div');
    if (msg.username === '<%= username %>') {
        messageElement.classList.add('message', 'sent');
    } else {
        messageElement.classList.add('message', 'received');
    }
    messageElement.innerHTML = `<strong>${msg.username}:</strong> ${msg.message}`;
    document.getElementById('messages').appendChild(messageElement);
});

socket.on('chat history', (history) => {
    const messagesDiv = document.getElementById('messages');
    history.forEach(msg => {
        const messageElement = document.createElement('div');
        if (msg.username === '<%= username %>') {
            messageElement.classList.add('message', 'sent');
        } else {
            messageElement.classList.add('message', 'received');
        }
        messageElement.innerHTML = `<strong>${msg.username}:</strong> ${msg.message}`;
        messagesDiv.appendChild(messageElement);
    });
});

$('form').submit(function (e) {
    e.preventDefault();
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    window.scrollTo(0, document.body.scrollHeight);
    return false;
});