//
// Handles holding of cards after the first deal
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  handleIntent: function() {
    // The bet amount is optional - if not present we will use a default value
    // of either the last bet amount or 1 unit
    let reprompt;
    let error;
    let speech;
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];

    // See which card(s) were selected
    const holdCards = utils.getSelectedCards(this.event.request.locale,
            this.attributes, this.event.request.intent.slots);
    if (!holdCards || (holdCards.length === 0)) {
      const cardText = utils.getCardSlotText(this.event.request.locale,
            this.event.request.intent.slots);

      error = (cardText) ? res.strings.HOLD_INVALID_VALUE.replace('{0}', cardText)
                         : res.strings.HOLD_INVALID_NOVALUE;
      reprompt = res.strings.HOLD_REPROMPT;
    } else {
      // Mark each card as held
      holdCards.map((card) => {
        game.cards[card - 1].hold = true;
      });
    }

    if (!error) {
      reprompt = (this.attributes.firstHold)
              ? res.strings.HOLD_FIRST_REPROMPT
              : res.strings.HOLD_REPROMPT;
      game.lastHeld = holdCards;
      this.attributes.firstHold = false;
      speech = res.strings.HOLD_CARDS.replace('{0}',
              speechUtils.and(holdCards.map((index) => res.sayCard(game.cards[index - 1])),
                {locale: this.event.request.locale}));
      speech+= reprompt;
    }

    utils.emitResponse(this.emit, this.event.request.locale, error, null, speech, reprompt);
  },
};
