//
// Repeats the state of the game
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return ((request.type === 'IntentRequest') &&
      (((request.intent.name === 'AMAZON.RepeatIntent') || (request.intent.name === 'AMAZON.FallbackIntent'))
      || ((request.intent.name === 'SuggestIntent') && !attributes.choices && (game.state === 'NEWGAME'))));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    const rules = utils.getGame(attributes.currentGame);
    const game = attributes[attributes.currentGame];
    let speech;
    let reprompt;

    // Repeat is different based on state
    if (attributes.choices) {
      const result = utils.readAvailableGames(event.request.locale, attributes.currentGame, true);
      speech = result.speech;
      reprompt = res.strings.LAUNCH_REPROMPT.replace('{0}', res.sayGame(attributes.choices[0]));
      speech += reprompt;
    } else {
      if (attributes.suggestedHold) {
        speech = utils.readHand(event.request.locale, game);
        speech += rules.suggest(event.request.locale, attributes);
      } else if (game.state === 'FIRSTDEAL') {
        // Read the hand and any held cards
        speech = utils.readHand(event.request.locale, game);
      } else {
        // Tell them the game they are playing and their bankroll
        speech = res.strings.REPEAT_NEW_GAME
                  .replace('{0}', res.sayGame(attributes.currentGame))
                  .replace('{1}', game.bankroll);
      }

      reprompt = utils.readAvailableActions(event.request.locale, attributes);
      speech += reprompt;
    }

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
