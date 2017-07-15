//
// Reads the payout table
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const rules = utils.getGame(this.attributes.currentGame);
    let speech = '';
    const reprompt = res.strings.GENERIC_REPROMPT;
    let payout;

    // Any special message for this game
    if (rules.special) {
      speech += res.strings[rules.special];
    }

    for (payout in rules.payouts) {
      if (payout) {
        speech += utils.readPayout(this.event.request.locale, rules, payout);
        speech += utils.readPayoutAmount(this.event.request.locale, rules, payout);
        speech += ' <break time=\"200ms\"/>';
      }
    }

    speech += reprompt;

    this.emit(':askWithCard', speech, reprompt, res.strings.RULES_CARD_TITLE, utils.readPayoutTable(this.event.request.locale, rules));
  },
};
