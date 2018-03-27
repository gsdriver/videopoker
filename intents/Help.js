//
// Handles stop, which will exit the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    let speech = '';
    const game = this.attributes[this.attributes.currentGame];
    const reprompt = utils.readAvailableActions(this.event.request.locale,
              this.attributes, this.handler.state);
    const rules = utils.getGame(this.attributes.currentGame);
    let cardText;

    switch (this.handler.state) {
      case 'SELECTGAME':
        speech = res.strings.HELP_SELECTGAME;
        break;
      case 'SUGGESTION':
      case 'NEWGAME':
      case 'FIRSTDEAL':
        speech = res.strings.HELP_STATUS
            .replace('{0}', res.sayGame(this.attributes.currentGame))
            .replace('{1}', utils.readCoins(this.event.request.locale, game.bankroll));
        speech += reprompt;
        break;
    }

    cardText = res.strings[rules.help];
    cardText += utils.readPayoutTable(this.event.request.locale, rules);
    utils.emitResponse(this, null, null,
          speech, reprompt, res.strings.HELP_CARD_TITLE, cardText);
  },
};
