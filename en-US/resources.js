//
// Localized resources
//

const resources = {
  // From index.js
  'UNKNOWN_INTENT': 'Sorry, I didn\'t get that. Try saying Bet.',
  'UNKNOWN_INTENT_REPROMPT': 'Try saying Bet.',
  'UNKNOWN_SELECT_INTENT': 'Sorry, I didn\'t get that. Try saying Yes.',
  'UNKNOWN_SELECT_INTENT_REPROMPT': 'Try saying Yes.',
  // Launch.js
  'LAUNCH_REPROMPT': 'Would you like to play {0}? ',
  'LAUNCH_WELCOME': 'Welcome to Video Poker. ',
  // Select.js
  'SELECT_WELCOME': 'Welcome to {0}. ',
  'SELECT_REPROMPT': 'You can bet up to {0} coins or say read high scores to hear the leader board.',
  // From Exit.js
  'EXIT_GAME': '{0} Goodbye.',
  // From Hold.js
  'HOLD_CARDS': 'You held {0}. ',
  'HOLD_INVALID_VALUE': 'Sorry, I can\'t hold {0}. ',
  'HOLD_INVALID_NOVALUE': 'Sorry, I didn\'t hear a card to hold. ',
  'HOLD_FIRST_REPROMPT': 'Say hold to hold additional cards <break time=\"200ms\"/> discard to unmark this card as held <break time=\"200ms\"/> or deal to deal new cards.',
  'HOLD_NOTFOUND_REPROMPT': 'Try saying hold the first card or hold the {0}.',
  // From Discard.js
  'DISCARD_CARDS': 'You discarded {0}. ',
  'DISCARD_INVALID_VALUE': 'Sorry, I can\'t discard {0}. ',
  'DISCARD_INVALID_NOVALUE': 'Sorry, I didn\'t hear a card to discard. ',
  'DISCARD_REPROMPT': 'Say hold to hold additional cards <break time=\"200ms\"/> or deal to deal new cards.',
  'DISCARD_NOTFOUND_REPROMPT': 'Try saying discard the first card or discard the {0}.',
  // From Bet.js
  'BET_INVALID_AMOUNT': 'I\'m sorry, {0} is not a valid amount to bet.',
  'BET_EXCEEDS_MAX': 'Sorry, this bet exceeds the maximum bet of {0}.',
  'BET_EXCEEDS_BANKROLL': 'Sorry, this bet exceeds your bankroll of {0}.',
  'BET_PLACED': 'You bet {0}. ',
  'BET_PLACED_REPROMPT': 'Say the cards you would like to hold.',
  // From Help.js
  'HELP_STATUS': 'You are playing {0} and have a bankroll of {1}. ',
  'HELP_SELECTGAME': 'You can say yes to select the currently offered game or no to hear more choices. ',
  'HELP_REPROMPT': 'Check the Alexa companion app for the payout table.',
  'HELP_CARD_TITLE': 'Payout Table',
  // From Repeat.js
  'REPEAT_NEW_GAME': 'You are playing {0} with {1} coins. ',
  'HELD_CARDS': 'You selected to hold {0}. ',
  // From Suggest.js
  'SUGGEST_REPROMPT': 'Would you like to follow this suggestion?',
  'SUGGEST_NOT_TAKING': 'Say the cards you would like to hold.',
  // From Rules.js
  'RULES_REPROMPT': 'Say bet to insert coins or deal to deal cards.',
  'RULES_CARD_TITLE': 'Payout Table',
  // From Deal.js
  'DEAL_NOBETS': 'Sorry, you have to place a bet before you can deal cards.',
  'DEAL_INVALID_REPROMPT': 'Place a bet',
  'DEAL_PROGRESSIVE_WINNER': 'You hit the progressive jackpot and won {0}! ',
  'DEAL_WINNER': 'You matched {0} and won {1}. ',
  'DEAL_LOSER': 'Sorry, you lost. ',
  'DEAL_PLAY_AGAIN': 'Would you like to play again?',
  'DEAL_BUSTED': 'You lost all your money. Resetting to 1000 coins and clearing your bet. ',
  'DEAL_BUSTED_REPROMPT': 'Place a bet.',
  'DEALT_CARDS': 'You got {0}. ',
  // From utils.js
  'PAYOUT_PAYS': 'pays {0} coins.',
  'PAYOUT_PROGRESSIVE': 'pays the progessive jackpot.',
  'PAYOUT_WILD': '{0} are wlid. ',
  'LEADER_RANKING': 'Your high score of {0} coins on {1} ranks you as <say-as interpret-as="ordinal">{2}</say-as> of {3} players. ',
  'LEADER_NO_SCORES': 'Sorry, I\'m unable to read the current leader board',
  'LEADER_FORMAT': '{0} coins',
  'LEADER_TOP_SCORES': 'The top {0} scores are ',
  'AVAILABLE_GAMES': 'We have {0} different games <break time=\"200ms\"/> ',
  'DEUCES_SPECIAL': 'Natural royal flush wins the progressive jackpot when the maximum number of coins are played. ',
  'JACKS_SPECIAL': 'Royal flush wins the progressive jackpot when the maximum number of coins are played. ',
  'SAY_YES_SELECT': 'yes to select this game',
  'SAY_NO_SELECT': 'no to hear the next game',
  'SAY_YES_SUGGEST': 'yes to play this suggestion',
  'SAY_BET': 'bet',
  'SAY_DEAL': 'deal cards',
  'SAY_HOLD': 'hold to hold a card',
  'SAY_DISCARD': 'discard to unmark a held card',
  'SAY_HIGHSCORE': 'read high scores to hear the leader board',
  'YOU_CAN_SAY': 'You can say {0}.',
  'CARD_NOT_FOUND_HOLD': 'Sorry, I don\'t know how to hold {0}. ',
  'CARD_NOT_FOUND_DISCARD': 'Sorry, I don\'t know how to discard {0}. ',
  'NO_CARD_SPECIFIED_HOLD': 'Sorry, I didn\'t hear any cards to hold. ',
  'NO_CARD_SPECIFIED_DISCARD': 'Sorry, I didn\'t hear any cards to discard. ',
  'SUGGEST_HOLD_ALL': 'You should hold all your cards. ',
  'SUGGEST_HOLD_MATCHING': 'You should hold the {0}. ',
  'SUGGEST_HOLD_CARDS': 'You should hold {0}. ',
  'SUGGEST_DISCARD_ALL': 'You shouldn\'t hold any of your cards. ',
  // General
  'SINGLE_COIN': 'coin',
  'PLURAL_COIN': 'coins',
  'READ_BANKROLL': 'You have {0}. ',
  'PROGRESSIVE_JACKPOT': 'The progressive jackpot is currently {0} coins. Bet {1} coins to win the progressive jackpot. ',
  'GENERIC_REPROMPT': 'What else can I help you with?',
};

module.exports = {
  strings: resources,
  sayGame: function(game) {
    const gameMap = {'jacks': 'jacks or better',
      'deuces': 'deuces wild'};

    return (gameMap[game]) ? gameMap[game] : game;
  },
  pluralCardRanks: function(card) {
    const names = {'A': 'aces', '2': 'twos', '3': 'threes', '4': 'fours', '5': 'fives',
            '6': 'sixes', '7': 'sevens', '8': 'eights', '9': 'nines', '10': 'tens',
            'J': 'jacks', 'Q': 'queens', 'K': 'kings'};
    return names[card.rank];
  },
  pluralCardSuits: function(card) {
    const suits = {'C': 'clubs', 'D': 'diamonds', 'H': 'hearts', 'S': 'spades'};
    return suits[card.suit];
  },
  sayCard: function(card, withArticle) {
    const names = {'A': 'ace', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
            '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
            'J': 'jack', 'Q': 'queen', 'K': 'king'};
    const articleNames = {'A': 'an ace', '2': 'a two', '3': 'a three', '4': 'a four', '5': 'a five',
            '6': 'a six', '7': 'a seven', '8': 'an eight', '9': 'a nine', '10': 'a ten',
            'J': 'a jack', 'Q': 'a queen', 'K': 'a king'};
    const suitNames = {'C': 'of clubs', 'D': 'of diamonds', 'H': 'of hearts', 'S': 'of spades'};

    if (withArticle === 'article') {
      if (articleNames[card.rank] && suitNames[card.suit]) {
        return (articleNames[card.rank] + ' ' + suitNames[card.suit]);
      }
    } else {
      if (names[card.rank] && suitNames[card.suit]) {
        return (names[card.rank] + ' ' + suitNames[card.suit]);
      }
    }

    // One or the other was invalid, so return undefined
    return undefined;
  },
  ordinalMapping: function(ordinal) {
    const ordinals = {'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5, 'last': 5};

    return (ordinals[ordinal.toLowerCase()]);
  },
  getCardFromString: function(card) {
    const ranks = {'ace': 'A', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6',
        'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10', 'jack': 'J', 'queen': 'Q', 'king': 'K',
        'aces': 'A', 'twos': '2', 'threes': '3', 'fours': '4', 'fives': '5', 'sixes': '6',
        'sevens': '7', 'eights': '8', 'nines': '9', 'tens': '10', 'jacks': 'J', 'queens': 'Q', 'kings': 'K',
        '1': 'A', '2': '2', '3': '3', '4': '4', '5': '5',
        '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
        '1s': 'A', '2s': '2', '3s': '3', '4s': '4', '5s': '5',
        '6s': '6', '7s': '7', '8s': '8', '9s': '9', '10s': '10'};
    const suits = {'club': 'C', 'clubs': 'C', 'diamond': 'D', 'diamonds': 'D',
        'heart': 'H', 'hearts': 'H', 'spade': 'S', 'spades': 'S'};
    let rank;
    let suit;

    // OK, first let's process each word separately
    const words = card.split(' ');
    words.map((word) => {
      if (ranks[word]) {
        rank = ranks[word];
      } else if (suits[word]) {
        suit = suits[word];
      }
    });

    if (rank || suit) {
      return {rank: rank, suit: suit};
    } else {
      return undefined;
    }
  },
  readPayoutHand: function(hand) {
    const payouts = {
      'royalflush': 'royal flush',
      'straightflush': 'straight flush',
      '4ofakind': 'four of a kind',
      'fullhouse': 'full house',
      'flush': 'flush',
      'straight': 'straight',
      '3ofakind': 'three of a kind',
      '2pair': 'two pair',
      'minpair': 'jacks or better',
      'royalflushnatural': 'royal flush with no wild cards',
      '4wild': 'four deuces',
      '5ofakind': 'five of a kind',
    };

    return (payouts[hand] ? payouts[hand] : hand);
  },
};
