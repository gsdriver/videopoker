//
// Main handler for Alexa video poker skill
//

'use strict';

const AWS = require('aws-sdk');
const Alexa = require('ask-sdk');
const CanFulfill = require('./intents/CanFulfill');
const Bet = require('./intents/Bet');
const Deal = require('./intents/Deal');
const Hold = require('./intents/Hold');
const Toggle = require('./intents/Toggle');
const Discard = require('./intents/Discard');
const Rules = require('./intents/Rules');
const HighScore = require('./intents/HighScore');
const Repeat = require('./intents/Repeat');
const Suggest = require('./intents/Suggest');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');
const Launch = require('./intents/Launch');
const Select = require('./intents/Select');
const SessionEnd = require('./intents/SessionEnd');
const TakeSuggestion = require('./intents/TakeSuggestion');
const Unhandled = require('./intents/Unhandled');
const utils = require('./utils');
const request = require('request');


const requestInterceptor = {
  process(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const event = handlerInput.requestEnvelope;
    let attributes;

    if ((Object.keys(sessionAttributes).length === 0) ||
      ((Object.keys(sessionAttributes).length === 1)
        && sessionAttributes.platform)) {
      // No session attributes - so get the persistent ones
      return attributesManager.getPersistentAttributes()
      .then((attr) => {
        attributes = attr;
        if (!attributes.currentGame) {
          attributes.currentGame = 'jacks';
        }

        if (!attributes[attributes.currentGame]) {
          attributes[attributes.currentGame] = {
            bankroll: 1000,
            high: 1000,
          };
        }

        attributes.temp = {};
        attributes.temp.speechParams = {};
        attributes.temp.repromptParams = {};
        attributes.firstHold = true;
        attributes.firstBet = true;

        if (!attributes.currentGame) {
          attributes.currentGame = 'basic';
          attributes.newUser = true;
          request.post({url: process.env.SERVICEURL + 'videopoker/newUser'}, (err, res, body) => {
          });
        }

        attributes.playerLocale = event.request.locale;
        attributesManager.setSessionAttributes(attributes);
        return;
      });
    } else {
      attributes = handlerInput.attributesManager.getSessionAttributes();
      attributes.temp.speechParams = {};
      attributes.temp.repromptParams = {};
      return Promise.resolve();
    }
  },
};

const saveResponseInterceptor = {
  process(handlerInput) {
    const response = handlerInput.responseBuilder.getResponse();
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if (response) {
      if (response.shouldEndSession) {
        // We are meant to end the session
        // We're ending the session so ignore timeouts
        attributes.temp.ignoreTimeouts = true;
        return SessionEnd.handle(handlerInput);
      } else {
        // Save the response and reprompt for repeat
        if (response.outputSpeech && response.outputSpeech.ssml) {
          // Strip <speak> tags
          let lastResponse = response.outputSpeech.ssml;
          lastResponse = lastResponse.replace('<speak>', '');
          lastResponse = lastResponse.replace('</speak>', '');
          attributes.temp.lastResponse = lastResponse;
        }

        if (response.reprompt && response.reprompt.outputSpeech
          && response.reprompt.outputSpeech.ssml) {
          let lastReprompt = response.reprompt.outputSpeech.ssml;
          lastReprompt = lastReprompt.replace('<speak>', '');
          lastReprompt = lastReprompt.replace('</speak>', '');
          attributes.temp.lastReprompt = lastReprompt;
        }

        if (!process.env.NOLOG) {
          console.log(JSON.stringify(response));
        }
        return Promise.resolve();
      }
    } else {
      return Promise.resolve();
    }
  },
};

const ErrorHandler = {
  canHandle(handlerInput, error) {
    console.log(error);
    return error.name.startsWith('AskSdk');
  },
  handle(handlerInput, error) {
    return handlerInput.jrb
      .speak(ri('SKILL_ERROR'))
      .getResponse();
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runSkill);
} else {
  exports.handler = runSkill;
}

function runSkill(event, context, callback) {
  const skillBuilder = new Alexa.SkillBuilders.custom();

  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    callback(null, CanFulfill.check(event));
    return;
  }

  const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
  const dbAdapter = new DynamoDbPersistenceAdapter({
    tableName: 'VideoPoker',
    partitionKeyName: 'userId',
    attributesName: 'mapAttr',
  });
  const skillFunction = skillBuilder.addRequestHandlers(
      Launch,
      Select,
      Bet,
      Deal,
      Hold,
      Discard,
      Toggle,
      Suggest,
      TakeSuggestion,
      Rules,
      HighScore,
      Repeat,
      Help,
      Exit,
      Unhandled
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(requestInterceptor)
    .addResponseInterceptors(saveResponseInterceptor)
    .withPersistenceAdapter(dbAdapter)
    .withApiClient(new Alexa.DefaultApiClient())
    .withSkillId('amzn1.ask.skill.8f0ddee1-51b3-496a-9424-524436770828')
    .lambda();
  skillFunction(event, context, (err, response) => {
    callback(err, response);
  });
}

function saveState(userId, attributes) {
  const formData = {};

  formData.savedb = JSON.stringify({
    userId: userId,
    attributes: attributes,
  });

  const params = {
    url: process.env.SERVICEURL + 'videopoker/saveState',
    formData: formData,
  };

  request.post(params, (err, res, body) => {
    if (err) {
      console.log(err);
    }
  });
}

