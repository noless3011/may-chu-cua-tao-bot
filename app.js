import 'dotenv/config';
import express from 'express';
import {ask} from './gemini.js';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji } from './utils.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { createAudioResource, getVoiceConnection, joinVoiceChannel, createAudioPlayer } from '@discordjs/voice';
import { GetAudioStream } from './music.js';


// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ]
});
//music player
const audioPlayer = createAudioPlayer();

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction type and data
  const interaction = req.body;
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
    const { name } = data;

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

    if (name === 'join') {
      //The current voice channel that the bot is in
      let voiceChannel;
      const guild = await client.guilds.fetch(interaction.guild_id);
      const member = await guild.members.fetch(interaction.member.user.id);
      
      // Get the channel name from the option, if provided
      const channelName = interaction.data.options ? 
        interaction.data.options.find(option => option.name === 'channel')?.value : null;

      if (channelName) {
        // If a channel name was provided, find that channel
        voiceChannel = guild.channels.cache.find(
          channel => channel.type === 2 && channel.name.toLowerCase() === channelName.toLowerCase()
        );
        if (!voiceChannel) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Could not find a voice channel named "${channelName}".`,
            },
          });
        }
      } else {
        // If no channel name was provided, use the member's current voice channel
        voiceChannel = member.voice.channel;
        if (!voiceChannel) {
          // If the member is not in a voice channel, join the first available voice channel
          voiceChannel = guild.channels.cache.find(channel => channel.type === 2);
          if (!voiceChannel) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'Could not find any voice channels to join.',
              },
            });
          }
        }
      }

      try {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });
        connection.subscribe(audioPlayer);
        
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Joined the voice channel: ${voiceChannel.name}!`,
          },
        });
      } catch (error) {
        console.error(error);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Failed to join the voice channel.',
          },
        });
      }
    }
    if(name === 'leave'){
      const connection = getVoiceConnection(interaction.guild_id);
      if(!connection){
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
              content: 'I\'m not in a voice channel!',
          },
        });
      }else{
        connection.destroy();
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
              content: 'Left the voice channel!',
          },
      });
      }
    }
    if(name === 'play'){
      const connection = getVoiceConnection(interaction.guild_id);
      if(!connection){
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
              content: 'I\'m not in a voice channel!',
          },
        });
      }
      try{
        const source = GetAudioStream(req.body.data.options[0].value);
        const resource = createAudioResource(source);
        audioPlayer.play(resource);
        console.log("Audio player playing");
      }catch(error){
        return res.status(400).json({ error: 'failed to play' });
      }  
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Playing!',
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
client.login(process.env.DISCORD_TOKEN);

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});

