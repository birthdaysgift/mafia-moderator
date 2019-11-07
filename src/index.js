const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = 3000;
const STATIC_DIR = path.join(__dirname, '..', '/public');

app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.urlencoded({extended: true}));
app.use(express.static(STATIC_DIR, {index: false}));
app.use(session({secret: 'keyboard cat'}));

var users = new Map();
var games = new Map(); 
var gameSockets = new Map();

function socketBindings(serverSocket, clientSocket) {
    console.log('Somebody connected');
    clientSocket.on('user ready', (data) => {
        let g = games.get(data.gameId);
        let u = g.getMember(data.userId);
        u.state = User.READY;
        serverSocket.emit('user ready', JSON.stringify(u));
        if (g.isEverybodyReady()) {
            serverSocket.emit('everybody ready');
        }
    });
    clientSocket.on('user not ready', (data) => {
        let g = games.get(data.gameId);
        let u = g.getMember(data.userId);
        u.state = User.NOT_READY;
        serverSocket.emit('user not ready', JSON.stringify(u));
    });
}

class User {
    constructor(name) {
        this.name = name;
        this.id = User.nextId++;
        this.state = User.NOT_READY;
    }

    isReady() {
        return this.state === User.READY;
    }

    toString() {
        return `${this.id} ${this.name}`
    }
}
User.nextId = 0;
User.NOT_READY = 'not ready';
User.READY = 'ready';


class Game {
    constructor(title, host) {
        this.title = title;
        this.host = host;
        this.id = Game.nextId++;
        this.members = [host];

        let socket = io.of(`/${this.id}-game`);
        socket.on('connection', (sock) => socketBindings(socket, sock));
        gameSockets.set(this.id, socket);
    }

    isEverybodyReady() {
        return this.members.every(
            (m) => m.isReady()
        );
    }

    addMember(user) {
        this.members.push(user);
        gameSockets.get(this.id).emit(
            'new member', JSON.stringify(user)
        );
    }

    getMember(userId) {
        return this.members.filter((m) => m.id === userId)[0];
    }

    toString () {
        return `${this.id} ${this.title}`
    }
}
Game.nextId = 0;

app.route('/')
    .get((req, res) => res.render('index'))
    .post((req, res) => {
        let u = new User(req.body.name);
        users.set(u.id, u);
        req.session.user = u;
        res.redirect('/new_game/');
    });
app.route('/new_game/')
    .get((req, res) => {
        let name = req.session.user
            ? req.session.user.name
            : 'Anonymous'
        res.render('new_game', {name: name});
    });
app.post('/create_game/', (req, res) => {
    let u = users.get(req.session.user.id);
    let g = new Game(req.body.title, u);
    games.set(g.id, g);
    req.session.game = g;
    res.redirect('/game/');
});
app.post('/join_game/', (req, res) => {
    let g = games.get(parseInt(req.body.id));
    let u = users.get(req.session.user.id);
    g.addMember(u);
    req.session.game = g;
    res.redirect('/game/');
})
app.get('/game/', (req, res) => {
    res.render('game', {
        game: req.session.game,
        user: req.session.user
    });
});
app.get('/whatishappening/', (req, res) => {
    res.send({
        userId: req.session.user.id,
        gameId: req.session.game.id
    });
})

server.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
