const express = require('express');
const session = require('express-session');
const connectRedis = require('connect-redis');
const RedisStore = connectRedis(session);
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


try {
    const data = fs.readFileSync(chatHistoryFile);
    chatHistory = JSON.parse(data);
} catch (err) {
    console.error("Error loading chat history:", err);
    fs.writeFileSync(chatHistoryFile, JSON.stringify([]));
}

// Konfigurasi Redis
const redisOptions = {
    host: 'localhost', // Ganti jika Redis Anda di server berbeda
    port: 6379        // Port default Redis
    // tambahkan password jika ada: pass: 'yourRedisPassword'
};




app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    store: new RedisStore(redisOptions),
    secret: 'WANZOFC-KONTOL-ALOK', // Ganti dengan secret key yang lebih kuat dan unik
    resave: false,
    saveUninitialized: false, // Idealnya false, sesuaikan dengan kebutuhan aplikasi
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: false // Set ke true jika menggunakan HTTPS. Jika HTTPS aktif, httpOnly juga harus true
,       httpOnly: true // Mencegah client-side script untuk mengakses cookie, meningkatkan keamanan   
    }
}));

// Apply session middleware to socket.io
io.use((socket, next) => {
    session(app)(socket.request, socket.request.res || {}, next);
});

// ... (kode routing dan socket.io lainnya) -  sisanya sama seperti kode sebelumnya

// ...


http.listen(3000, () => {
    console.log('listening on *:3000');
});