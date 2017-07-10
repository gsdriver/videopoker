//
// Repeats the state of the game
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];
    let speech;
    let reprompt;

    // Repeat is different based on state
    switch (this.handler.state) {
      case 'SELECTGAME':
        // Tell them the available choices
        if (this.attributes.choices) {
          utils.readAvailableGames(this.event.request.locale,
              this.attributes.currentGame, true, (gameText, choices) => {
            speech = gameText;
            reprompt = res.strings.LAUNCH_REPROMPT.replace('{0}', res.sayGame(this.attributes.choices[0]));
            speech += reprompt;
            utils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
          });
        } else {
          // Hmm - invalid state - reset for them
          console.log('Error in Repeat - no choices during SELECTGAME');
          this.handler.state = '';
          this.emitWithState('LaunchRequest');
        }
        break;
      case 'NEWGAME':
        // Tell them the game they are playing and their bankroll
        speech = res.strings.REPEAT_NEW_GAME
                  .replace('{0}', res.sayGame(this.attributes.currentGame))
                  .replace('{1}', game.bankroll);
        reprompt = utils.readAvailableActions(this.event.request.locale,
                  this.attributes, this.handler.state);
        speech += reprompt;
        utils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
        break;
      case 'FIRSTDEAL':
        // Read the hand and any held cards
        const heldCards = [];

        speech = res.strings.DEALT_CARDS.replace('{0}',
                speechUtils.and(game.cards.map((card) => res.sayCard(card)),
                  {pause: '300ms', locale: this.event.request.locale}));

        game.cards.map((card) => {
          if (card.hold) {
            heldCards.push(card);
          }
        });
        if (heldCards.length) {
          speech += res.strings.HELD_CARDS.replace('{0}',
                speechUtils.and(heldCards.map((card) => res.sayCard(card)),
                  {pause: '300ms', locale: this.event.request.locale}));
        }

        reprompt = utils.readAvailableActions(this.event.request.locale,
                  this.attributes, this.handler.state);
        speech += reprompt;
        utils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
        break;
      default:
        // Not sure what to do
        speech = res.strings.UNKNOWN_INTENT;
        reprompt = res.strings.UNKNOWN_INTENT_REPROMPT;
        speech += reprompt;
        utils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
        break;
    }
  },
};
