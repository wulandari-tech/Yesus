const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});
const fs = require('fs');
const bodyParser = require('body-parser');

const chatHistoryFile = 'chat_history.json';
let chatHistory = [];

// Middleware
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Load chat history
try {
    const data = fs.readFileSync(chatHistoryFile);
    chatHistory = JSON.parse(data);
} catch (err) {
    console.error("Error loading chat history:", err);
    fs.writeFileSync(chatHistoryFile, JSON.stringify([]));
}

// Routes
app.get('/', (req, res) => {
    res.render('index', { error: null });
});

app.post('/login', (req, res) => {
    const { username } = req.body;
    if (username) {
        req.app.locals.username = username; //simpan sementara username di app.locals
        res.redirect('/chat');
    } else {
        res.render('index', { error: "Username cannot be empty" });
    }
});

app.get('/chat', (req, res) => {
     const username = req.app.locals.username;

    if (username) {
          res.render('chat', { username: username }); // Kirim username ke chat.ejs
    } else {
        res.redirect('/');
    }
});

app.get('/history', (req, res) => {
    res.json(chatHistory);
});

// Socket.IO
io.on('connection', (socket) => {
        const username = socket.handshake.query.username; // Ambil username dari query parameter


    console.log('A user connected with username:', username);
    socket.emit('chat history', chatHistory);

    socket.on('chat message', (msg) => {
        const message = { username, message: msg }; //gunakan username dari query parameter
        chatHistory.push(message);
        io.emit('chat message', message);

                fs.writeFile(chatHistoryFile, JSON.stringify(chatHistory), (err) => {
            if (err) {
                console.error('Error saving chat history:', err);
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', username);
    });
});

// Start Server
http.listen(3000, () => {
    console.log('listening on *:3000');
});