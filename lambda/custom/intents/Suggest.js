//
// Provides a suggestion for play
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    // Can always handle with Stop and Cancel
    return ((request.type === 'IntentRequest') && (request.intent.name === 'SuggestIntent')
      && (attributes.choices || (game && game.state === 'FIRSTDEAL')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    const game = attributes[attributes.currentGame];
    let speech;
    let reprompt;

    if (attributes.choices) {
      speech = res.strings.SUGGEST_SELECT_GAME
          .replace('{0}', res.sayGame(attributes.choices[0]));
      reprompt = speech;
    } else {
      const rules = utils.getGame(attributes.currentGame);

      speech = rules.suggest(event.request.locale, attributes);
      reprompt = res.strings.SUGGEST_REPROMPT;
      speech += reprompt;
    }

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
