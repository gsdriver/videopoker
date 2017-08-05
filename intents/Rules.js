//
// Reads the payout table
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const rules = utils.getGame(this.attributes.currentGame);
    let speech;
    const reprompt = res.strings.GENERIC_REPROMPT;

    // Any special message for this game
    speech = res.strings[rules.special];
    speech += res.strings.RULES_READ_CARD;
    speech += reprompt;

    utils.emitResponse(this.emit, this.event.request.locale, null, null,
          speech, reprompt, res.strings.RULES_CARD_TITLE,
          utils.readPayoutTable(this.event.request.locale, rules));
  },
};
