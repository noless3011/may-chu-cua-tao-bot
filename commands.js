import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

const JOIN_CHANNEL_COMMAND = {
  name: 'join',
  description: 'join the voice channel',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'channel',
      type: 3, // Type 3 stands for STRING (as per Discord API standards)
      description: 'The channel you want me to join',
      required: true,
    },
  ],
};

const LEAVE_CHANNEL_COMMAND = {
  name: 'leave',
  description: 'leave the voice channel',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const PLAY_AUDIO_COMMAND = {
  name: 'play',
  description: 'play the music',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'youtubelink',
      type: 3, // Type 3 stands for STRING (as per Discord API standards)
      description: 'The music you want me to play',
      required: true,
    },
  ],
};

const GEMINI_ASK_COMMAND = {
  name: 'ask',
  description: 'Ask chat a question',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'question',
      type: 3, // Type 3 stands for STRING (as per Discord API standards)
      description: 'The question you want to ask',
      required: true,
    },
  ],
};

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND,JOIN_CHANNEL_COMMAND,LEAVE_CHANNEL_COMMAND, PLAY_AUDIO_COMMAND, GEMINI_ASK_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
