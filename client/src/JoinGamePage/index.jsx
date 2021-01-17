import React, { Component } from 'react';

import Button from '../Button';
import Title from '../Title';
import InputForm from '../InputForm';
import PageContext from '../context';
import game_proxy from '../game';
import user_proxy from '../user';
import socket from '../sockets';

import './style.less';

export default class JoinGamePage extends Component {
    static contextType = PageContext;
    constructor(props) {
        super(props);

        socket.on('join response', (userID, gameID) => {
            let user = user_proxy.object;
            user.id = userID;
            user_proxy.object = user;
            socket.emit('update request', userID, gameID);
        });
        socket.on('update response', (userID, gameJSON) => {
            game_proxy.json = gameJSON;

            let game = game_proxy.object;
            game.members.push(user_proxy.object);
            game_proxy.object = game;
            
            socket.emit('update', game_proxy.json);

            this.context.setRoute('/gamelobby');
        });
    }

    handleChange = (e) => {
        let game = game_proxy.object;
        game.id = e.input.value; 
        game_proxy.object = game;
    }

    handleSubmit = (e) => {
        socket.emit('join request', game_proxy.object.id);
    };

    render() {
        return (
            <div id='join_game_page'>
                <Title/>
                <InputForm
                    text='Join'
                    value={game_proxy.object.id || ''}
                    placeholder='Enter game ID'
                    onChange={this.handleChange}
                    onSubmit={this.handleSubmit}/>
                <Button text='Back' onClick={() => this.context.setRoute('/newgame')}/>
            </div>
        )
    }
}