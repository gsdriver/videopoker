//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle: function(handlerInput) {
    return handlerInput.requestEnvelope.session.new ||
      (handlerInput.requestEnvelope.request.type === 'LaunchRequest');
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Tell them the rules, their bankroll and offer a few things they can do
    const res = require('../' + event.request.locale + '/resources');
    let speech = res.strings.LAUNCH_WELCOME;

    // Read the available games then prompt for each one
    const result = utils.readAvailableGames(event.request.locale, attributes.currentGame, true);
    speech += result.speech;
    attributes.choices = result.choices;

    // Ask for the first one
    const reprompt = res.strings.LAUNCH_REPROMPT.replace('{0}', res.sayGame(result.choices[0]));
    speech += reprompt;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
