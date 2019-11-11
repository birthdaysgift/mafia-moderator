var d = document;
var STATES, ROLES;
var socket;

axios.get('/whatishappening/')
    .then((response) => {
        STATES = response.data.STATES;
        ROLES = response.data.ROLES;
        
        socket = io(`/${response.data.game.id}-game`);
        socketLogging(socket);
        socket.emit(
            'new member',
            response.data.user.id,
            response.data.game.id
        );
        ReactDOM.render(
            <Window
                game={response.data.game}
                user={response.data.user}/>,
            d.querySelector('.game')
        );
    });

class Window extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: this.props.user,
            game: this.props.game
        };

        socket.on('new member', (userJSON, gameJSON) => {
            this.setState({game: JSON.parse(gameJSON)});
        });
        socket.on('user disconnected', (userJSON, gameJSON) => {
            this.setState({game: JSON.parse(gameJSON)});
        });
        socket.on('user ready', (userJSON, gameJSON) => {
            this.setState({game: JSON.parse(gameJSON)});
            let u = JSON.parse(userJSON);
            if (this.state.user.id === u.id) {
                this.setState({user: u});
            }
        });
        socket.on('user not ready', (userJSON, gameJSON) => {
            this.setState({game: JSON.parse(gameJSON)});
            let u = JSON.parse(userJSON);
            if (this.state.user.id === u.id) {
                this.setState({user: u});
            }
        });

        socket.on('start game', (userJSON, gameJSON) => {
            this.setState({
                user: JSON.parse(userJSON),
                game: JSON.parse(gameJSON)
            });
        });
    }

    render() {
        if (this.state.game.state === STATES.GAME.NOT_STARTED) {
            return <Lobby
                        user={this.state.user}
                        game={this.state.game}/>;
        } else {
            return <Game
                        user={this.state.user}
                        game={this.state.game}/>;
        }
    }
}

function Lobby(props) {
    let everybodyReady = props.game.members.every(
        (m) => m.state === STATES.USER.READY
    );
    let userIsHost = props.game.host.id === props.user.id;
    return (
        <div>
            <h1>{props.game.title}</h1>
            <StartButton
                show={everybodyReady && userIsHost}/>
            <ReadyButton showReady={!(props.user.state === STATES.USER.READY)}/>
            <div>Host: {props.game.host.name}</div>
            <UsersList members={props.game.members}/>
        </div>
    );
}

class StartButton extends React.Component {
    constructor(props) {
        super(props);
        
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        socket.emit('start game');
    }

    render() {
        let element = <div onClick={this.handleClick}>START</div>;
        return this.props.show ? element : null
    }
}

class ReadyButton extends React.Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        if (this.props.showReady) {
            socket.emit('user ready');
        } else {
            socket.emit('user not ready');
        }
    }

    render() {
        return (
            <div onClick={this.handleClick}>
                {this.props.showReady ? "READY" : "NOT READY"}
            </div>
        )
    }
}

function UsersList(props) {
    let listItems = props.members.map((m) => {
        let state;
        if (m.state === STATES.USER.READY) {
            state = 'READY';
        } else if (m.state === STATES.USER.NOT_READY) {
            state = 'NOT READY';
        }
        return <li key={m.id}>{m.name} {state}</li>;
    });
    return <ul>{listItems}</ul>;
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: this.props.user,
            game: this.props.game,
        };

        this.handleReadyClick = this.handleReadyClick.bind(this);

        socket.on('everybody ready for night', (gameJSON) => {
            this.setState({
                showStart: true,
                game: JSON.parse(gameJSON)
            });
        });
    }

    handleReadyClick() {
        socket.emit('ready for night');
    }

    render() {
        let element;
        if (this.state.game.state === STATES.GAME.NIGHT) {
            element = <h1>night</h1>;
        } else {
            element = (
                <div>
                    <Role role={this.props.user.role}/>
                    {this.state.showStart ? <div>START NIGHT</div> : null}
                    <div onClick={this.handleReadyClick}>READY TO SLEEP</div>
                </div>
            );
        }
        return element;
    }
}

class Role extends React.Component {
    constructor(props) {
        super(props);
        this.state = {show: false};

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.setState((state) => ({show: !state.show}));
    }

    render() {
        let role;
        if (this.props.role === ROLES.MAFIA) {
            role = 'MAFIA';
        } else if (this.props.role === ROLES.INNOCENT) {
            role = 'INNOCENT';
        }
        return (
            <div>
                <h1>{this.state.show ? role : null}</h1>
                <div onClick={this.handleClick}>
                    {this.state.show ? 'HIDE' : 'SHOW'} ROLE
                </div>
            </div>
        )
    }
}

function socketLogging(socket) {
    socket.on('new member', (userJSON, gameJSON) => {
        console.log(`${JSON.parse(userJSON).name} connected`);
    });
    socket.on('user disconnected', (userJSON, gameJSON) => {
        console.log(`${JSON.parse(userJSON).name} disconnected`);
    });
    socket.on('user ready', (userJSON, gameJSON) => {
        console.log(`${JSON.parse(userJSON).name} ready`);
    });
    socket.on('user not ready', (userJSON, gameJSON) => {
        console.log(`${JSON.parse(userJSON).name} not ready`);
    });
    socket.on('everybody ready', () => {
        console.log('everybody ready');
    });
    socket.on('start game', (userJSON, gameJSON) => {
        console.log(`${JSON.parse(gameJSON).title} started`);
    });
    socket.on('ready for night', (userJSON, gameJSON) => {
        console.log(`${JSON.parse(userJSON).name} ready for night`);
    });
    socket.on('everybody ready for night', (gameJSON) => {
        console.log('everybody ready for night');
    });
}
