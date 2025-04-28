const express = require('express');
const session = require('express-session');
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

// Session Configuration (MemoryStore - NOT FOR PRODUCTION)
app.use(session({
    secret: 'your_secret_key',  // Ganti dengan secret key yang kuat dan unik!
    resave: false, // tambahkan baris ini
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: true,  // Setel true jika menggunakan HTTPS        
        httpOnly: false,
      
    },
    store: new session.MemoryStore() 
}));

io.use((socket, next) => {
    session(app)(socket.request, socket.request.res || {}, next);
});

// Load Chat History
try {
    const data = fs.readFileSync(chatHistoryFile);
    chatHistory = JSON.parse(data);
} catch (err) {
    console.error("Error loading chat history:", err);
    // Create a new file if it doesn't exist
    fs.writeFileSync(chatHistoryFile, JSON.stringify([]));
}

// Routes
app.get('/', (req, res) => {
    if (req.session.username) {
        res.redirect('/chat');
    } else {
        res.render('index', { error: null });
    }
});

app.post('/login', (req, res) => {
    const { username } = req.body;
    if (username) {
        req.session.username = username;
        res.redirect('/chat');
    } else {
        res.render('index', { error: "Username cannot be empty" });
    }
});


app.get('/chat', (req, res) => {
    if (req.session.username) {
        res.render('chat', { username: req.session.username, chatHistory });
    } else {
        res.redirect('/');
    }
});


app.get('/history', (req, res) => {
    res.json(chatHistory);
});


// Socket.IO Event Handlers
io.on('connection', (socket) => {
    console.log('A user connected');
    const username = socket.request.session.username;
    socket.emit('chat history', chatHistory);

    socket.on('chat message', (msg) => {
        const message = { username: username, message: msg };
        chatHistory.push(message);
        io.emit('chat message', message);

        // Save chat history to file
        fs.writeFile(chatHistoryFile, JSON.stringify(chatHistory), (err) => {
            if (err) {
                console.error('Error saving chat history:', err);
            }
        });
    });

    socket.on('disconnect', () => {
          console.log('User disconnected');
          fs.writeFile(chatHistoryFile, JSON.stringify(chatHistory), (err) => {
            if (err) {
                console.error('Error saving chat history:', err);
            }
        });    
    });
});

// Start Server
http.listen(3000, () => {
    console.log('listening on *:3000');
});