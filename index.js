//
// Main handler for Alexa video poker skill
//

'use strict';

const AWS = require('aws-sdk');
const Alexa = require('alexa-sdk');
const Bet = require('./intents/Bet');
const Deal = require('./intents/Deal');
const Hold = require('./intents/Hold');
const Discard = require('./intents/Discard');
const Rules = require('./intents/Rules');
const HighScore = require('./intents/HighScore');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');
const Launch = require('./intents/Launch');
const Select = require('./intents/Select');
const utils = require('./utils');

const APP_ID = 'amzn1.ask.skill.8f0ddee1-51b3-496a-9424-524436770828';

// Handlers for our skill
const selectGameHandlers = Alexa.CreateStateHandler('SELECTGAME', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.YesIntent': Select.handleYesIntent,
  'AMAZON.NoIntent': Select.handleNoIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWN_SELECT_INTENT, res.strings.UNKNOWN_SELECT_INTENT_REPROMPT);
  },
});

const newGameHandlers = Alexa.CreateStateHandler('NEWGAME', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'BetIntent': Bet.handleIntent,
  'BetMaxIntent': Bet.handleMaxIntent,
  'RulesIntent': Rules.handleIntent,
  'SelectIntent': Select.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'AMAZON.YesIntent': Bet.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWN_INTENT, res.strings.UNKNOWN_INTENT_REPROMPT);
  },
});

const firstDealHandlers = Alexa.CreateStateHandler('FIRSTDEAL', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'HoldIntent': Hold.handleIntent,
  'DiscardIntent': Discard.handleIntent,
  'DealIntent': Deal.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'AMAZON.YesIntent': Deal.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWN_INTENT, res.strings.UNKNOWN_INTENT_REPROMPT);
  },
});

const handlers = {
  'NewSession': function() {
    // Initialize attributes and route the request
    if (!this.attributes.currentGame) {
      this.attributes.currentGame = 'jacks';
      utils.saveNewUser();
    }

    if (!this.attributes[this.attributes.currentGame]) {
      this.attributes[this.attributes.currentGame] = {
        bankroll: 1000,
        high: 1000,
      };
    }

    this.attributes.firstHold = true;
    this.emit('LaunchRequest');
  },
  'LaunchRequest': Launch.handleIntent,
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWN_INTENT, res.strings.UNKNOWN_INTENT_REPROMPT);
  },
};

exports.handler = function(event, context, callback) {
  // Small enough volume for me to just write the incoming request
  if (event && !process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  AWS.config.update({region: 'us-east-1'});

  const alexa = Alexa.handler(event, context);

  alexa.APP_ID = APP_ID;
  alexa.dynamoDBTableName = 'VideoPoker';
  alexa.registerHandlers(handlers, newGameHandlers,
      firstDealHandlers, selectGameHandlers);
  alexa.execute();
};
