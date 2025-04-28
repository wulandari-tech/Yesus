const express = require('express');
const session = require('express-session');
const app = express();
const http = require('http').createServer(app);
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
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

// Load chat history from file
let chatHistory = [];
try {
    const data = fs.readFileSync(chatHistoryFile);
    chatHistory = JSON.parse(data);
} catch (err) {
    console.error("Error loading chat history:", err);
    // Create a new file if it doens't exist
    fs.writeFileSync(chatHistoryFile, JSON.stringify([]));


}


app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: false // Set to true if using HTTPS
    }
}));

// Apply session middleware to socket.io
io.use((socket, next) => {
    session(app)(socket.request, socket.request.res || {}, next);
});


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
        res.render('chat', { username: req.session.username, chatHistory }); // Pass username to chat page
    } else {
        res.redirect('/');
    }

});


app.get('/history', (req, res) => {
    res.json(chatHistory);
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.emit('chat history', chatHistory); // Send chat history to new user

    socket.on('chat message', (msg) => {
          const username = socket.request.session.username;
        const message = { username: username, message: msg }
        chatHistory.push(message);
        io.emit('chat message', message);


        // Save chat history to file after each message
        fs.writeFile(chatHistoryFile, JSON.stringify(chatHistory), (err) => {
            if (err) {
                console.error('Error saving chat history:', err);
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');


        // Save chat history to file on user disconnect
        fs.writeFile(chatHistoryFile, JSON.stringify(chatHistory), (err) => {
            if (err) {
                console.error('Error saving chat history:', err);
            }
        });
    });
});


http.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});