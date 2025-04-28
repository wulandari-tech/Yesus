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

// Load chat history
try {
    const data = fs.readFileSync(chatHistoryFile);
    chatHistory = JSON.parse(data);
} catch (err) {
    console.error("Error loading chat history:", err);
    fs.writeFileSync(chatHistoryFile, JSON.stringify([]));  // Create new file if it doesn't exist

}

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());




// Routes
app.get('/', (req, res) => {

        res.render('index', { error: null });

});


app.post('/login', (req, res) => {
    const { username } = req.body;
    if(username) {
        // Simpan username di dalam memory saja, karena kita tidak pakai session
        req.app.locals.username = username;
            res.redirect('/chat');

    } else {
         res.render('index', { error: "Username cannot be empty" });

    }
});




app.get('/chat', (req, res) => {
 // Gunakan username yang disimpan di memory
    const username = req.app.locals.username;
    if (username) {
        res.render('chat', { username: username, chatHistory });
    } else {
        res.redirect('/');
    }
});



app.get('/history', (req, res) => {
    res.json(chatHistory);
});



io.on('connection', (socket) => {
    console.log('A user connected');
     // Ambil username dari memory di server
     const username = socket.request.app.locals.username;

    socket.emit('chat history', chatHistory);


    socket.on('chat message', (msg) => {
                 const message = { username: username, message: msg };

        chatHistory.push(message);

        io.emit('chat message', message);

          fs.writeFile(chatHistoryFile, JSON.stringify(chatHistory), (err) => {
            if (err) {
                console.error('Error saving chat history:', err);
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});


http.listen(3000, () => {
    console.log('listening on *:3000');
});