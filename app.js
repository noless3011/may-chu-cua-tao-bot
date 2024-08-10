import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji } from './utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

async function ask(prompt) {
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
}

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction type and data
  const { type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = data;

    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `hello world ${getRandomEmoji()}`,
        },
      });
    }

    if (name === 'ask'){
      var chat_response = await ask(req.body.data.options[0].value);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content:chat_response,
        },
      });
    }

    if (name === 'challenge' && id) {
      // Interaction context
      const context = req.body.context;
      // User ID is in user field for (G)DMs, and member for servers
      const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
      // User's object choice
      const objectName = req.body.data.options[0].value;
  
      // Create active game using message ID as the game ID
      activeGames[id] = {
          id: userId,
          objectName,
      };
  
      return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: `Rock papers scissors challenge from <@${userId}>`,
          components: [
          {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
              {
                  type: MessageComponentTypes.BUTTON,
                  // Append the game ID to use later on
                  custom_id: `accept_button_${req.body.id}`,
                  label: 'Accept',
                  style: ButtonStyleTypes.PRIMARY,
              },
              ],
          },
          ],
      },
      });
  }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
