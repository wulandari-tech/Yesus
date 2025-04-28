const express = require('express');
const session = require('express-session');
const connectRedis = require('connect-redis');
const Redis = require('ioredis');
const RedisStore = connectRedis(session);
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000", // Ganti dengan URL frontend Anda jika berbeda
        methods: ["GET", "POST"],
        credentials: true
    }
});
const fs = require('fs');
const bodyParser = require('body-parser');

const chatHistoryFile = 'chat_history.json';
let chatHistory = [];

// Inisialisasi Redis
const redisOptions = {
    host: 'localhost',
    port: 6379
    // ... opsi lain jika diperlukan (password, dsb.)
};

const redisClient = new Redis(redisOptions);
const redisStore = new RedisStore({ client: redisClient });


// Middleware
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Konfigurasi Session dengan Redis
app.use(session({
    store: redisStore,
    secret: 'KONTOLYESUSPECAH', // Ganti dengan secret key yang kuat dan unik!
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: false, // Set ke true jika menggunakan HTTPS
        httpOnly: true 
    }
}));


// Socket.IO Middleware untuk Session
io.use((socket, next) => {
    session(app)(socket.request, socket.request.res || {}, next);
});




// Load chat history
try {
    const data = fs.readFileSync(chatHistoryFile);
    chatHistory = JSON.parse(data);
} catch (err) {
    console.error("Error loading chat history:", err);
    fs.writeFileSync(chatHistoryFile, JSON.stringify([]));
}



// Routing
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
        res.render('chat', { username: req.session.username });
    } else {
        res.redirect('/');
    }
});

app.get('/history', (req, res) => {
  res.json(chatHistory);
});



// Socket.IO Event Handlers
io.on('connection', (socket) => {
  
  const username = socket.request.session.username;


    console.log('A user connected', username);
    socket.emit('chat history', chatHistory);


    socket.on('chat message', (msg) => {
        const message = { username: username, message: msg };  // Mengirimkan username ke dalam pesan chat.
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
                // Save chat history to file on user disconnect
        fs.writeFile(chatHistoryFile, JSON.stringify(chatHistory), (err) => {
            if (err) {
                console.error('Error saving chat history:', err);
            }
        });

    });
});


// Error Handling untuk Redis
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
    // Implementasikan error handling yang sesuai di sini
});

// Start Server
http.listen(3000, () => {
    console.log('listening on *:3000');
});