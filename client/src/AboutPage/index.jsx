import React, { Component } from 'react';

import PageContext from '../context';
import Title from '../Title';
import Button from '../Button';

import './style.less';

export default class AboutPage extends Component{
    static contextType = PageContext;
    
    render() {
        return (
            <div id='about_page'>
                <Title/>
                <p>
                    Mafioso is an online helper for 
                    your <a target='_blank' rel='noopener noreferrer' href='https://en.wikipedia.org/wiki/Mafia_(party_game)'>Mafia</a> party 
                    games.
                </p>
                <p>
                    Mafioso takes a moderator role, when everybody at the party wants
                    to play a game and nobody wants to be a moderator. App runs on 
                    the phone of every player and lets him to see his role, 
                    participate in the voting process, ensures game phases changing 
                    and looks after overall game state (who is alive and what is the
                    current turn).
                </p>
                <Button onClick={() => this.context.setRoute('/welcome')} text='Back'/>
            </div>
        )
    }
}