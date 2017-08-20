//
// Provides a suggestion for play
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    let speech;

    if (this.handler.state === 'SELECTGAME') {
      speech = res.strings.SUGGEST_SELECT_GAME
          .replace('{0}', res.sayGame(this.attributes.choices[0]));
      utils.emitResponse(this.emit, this.event.request.locale, null, null, speech, speech);
    } else {
      const rules = utils.getGame(this.attributes.currentGame);
      const reprompt = res.strings.SUGGEST_REPROMPT;

      speech = rules.suggest(this.event.request.locale, this.attributes);
      speech += reprompt;
      this.handler.state = 'SUGGESTION';
      utils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
    }
  },
  handleYesIntent: function() {
    const game = this.attributes[this.attributes.currentGame];
    let i;

    // Mark each suggested card as held, and issue a deal
    for (i = 0; i < game.cards.length; i++) {
      game.cards[i].hold = (game.suggestedHold.indexOf(i + 1) > -1) ? true : undefined;
    }
    this.handler.state = 'FIRSTDEAL';
    this.emitWithState('DealIntent');
  },
  handleNoIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];
    let speech;
    const reprompt = res.strings.SUGGEST_NOT_TAKING;

    this.handler.state = 'FIRSTDEAL';
    game.suggestedHold = undefined;
    speech = utils.readHand(this.event.request.locale, game);
    speech += reprompt;
    utils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
  },
};
