//
// Provides a suggestion for play
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const rules = utils.getGame(this.attributes.currentGame);
    let speech;
    const reprompt = res.strings.GENERIC_REPROMPT;

    speech = rules.suggest(this.event.request.locale, this.attributes);
    speech += reprompt;
    utils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
  },
};
