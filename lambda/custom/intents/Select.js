//
// Handles selecting a game
//

'use strict';

const utils = require('../utils');
const Bet = require('./Bet');
const Deal = require('./Deal');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if ((request.type === 'IntentRequest') && attributes.choices) {
      // They are in game selection mode
      return ((request.intent.name === 'BetIntent')
        || (request.intent.name === 'BetMaxIntent')
        || (request.intent.name === 'DealIntent')
        || (request.intent.name === 'AMAZON.YesIntent')
        || (request.intent.name === 'AMAZON.NoIntent')
        || (request.intent.name === 'AMAZON.NextIntent'));
    } else {
      const game = attributes[attributes.currentGame];
      return ((game.state === 'NEWGAME') && (request.intent.name === 'SelectIntent'));
    }

    return false;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');

    if (!attributes.choices) {
      // Tell them the rules, their bankroll and offer a few things they can do
      let speech;

      // Read the available games then prompt for each one
      const result = utils.readAvailableGames(event.request.locale, attributes.currentGame, false);
      speech = result.speech;
      attributes.choices = result.choices;

      // Ask for the first one
      const reprompt = res.strings.LAUNCH_REPROMPT.replace('{0}', res.sayGame(result.choices[0]));
      speech += reprompt;
      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(reprompt)
        .getResponse();
    } else if ((request.intent.name === 'AMAZON.NoIntent') || (request.intent.name === 'AMAZON.NextIntent')) {
      // OK, pop this choice and go to the next one
      attributes.choices.shift();
      if (attributes.choices.length === 1) {
        // OK, we're going with this one
        return selectedGame(handlerInput);
      } else {
        const res = require('../' + event.request.locale + '/resources');
        const speech = res.strings.LAUNCH_REPROMPT.replace('{0}', res.sayGame(attributes.choices[0]));

        return handlerInput.responseBuilder
          .speak(speech)
          .reprompt(speech)
          .getResponse();
      }
    } else {
      // OK, select this game - forward to bet if they didn't just say "yes"
      return selectedGame(handlerInput, (request.intent.name !== 'AMAZON.YesIntent'));
    }
  },
};

function selectedGame(handlerInput, placeBet) {
  const event = handlerInput.requestEnvelope;
  const request = handlerInput.requestEnvelope.request;
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const res = require('../' + event.request.locale + '/resources');
  let speech;

  // Great, they picked a game
  attributes.currentGame = attributes.choices[0];
  attributes.choices = undefined;
  speech = res.strings.SELECT_WELCOME.replace('{0}', res.sayGame(attributes.currentGame));

  if (!attributes[attributes.currentGame]) {
    attributes[attributes.currentGame] = {
      bankroll: 1000,
      high: 1000,
    };
  }

  const game = attributes[attributes.currentGame];
  const rules = utils.getGame(attributes.currentGame);
  const reprompt = res.strings.SELECT_REPROMPT.replace('{0}', rules.maxCoins);

  // Check if there is a progressive jackpot
  game.state = 'NEWGAME';
  return utils.getProgressivePayout(attributes)
  .then((jackpot) => {
    speech += res.strings.READ_BANKROLL.replace('{0}', utils.readCoins(event.request.locale, game.bankroll));

    // Forward on to bet if appropriate
    if (placeBet) {
      if (jackpot) {
        speech += res.strings.PROGRESSIVE_JACKPOT_ONLY.replace('{0}', jackpot);
        game.progressiveJackpot = jackpot;
      }
      attributes.partialSpeech = speech;

      switch (request.intent.name) {
        case 'DealIntent':
          return Deal.handle(handlerInput);
          break;
        case 'BetMaxIntent':
          return Bet.handle(handlerInput);
          break;
        case 'BetIntent':
        default:
          return Bet.handle(handlerInput);
          break;
      }
    } else {
      if (jackpot) {
        // For progressive, just tell them the jackpot and to bet max coins
        speech += res.strings.PROGRESSIVE_JACKPOT.replace('{0}', jackpot).replace('{1}', rules.maxCoins);
        game.progressiveJackpot = jackpot;
      } else {
        speech += reprompt;
      }

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(reprompt)
        .getResponse();
    }
  });
}
