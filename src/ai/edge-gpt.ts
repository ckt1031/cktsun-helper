import crypto from 'node:crypto';

import axios from 'axios';
import ws from 'ws';

import logger from '../utils/logger';

export interface IEdgeGPTResponse {
  conversationId: string;
  clientId: string;
  conversationSignature: string;
  result: {
    value: string;
    message: string | null;
  };
}

export type ChatMode = 'creative' | 'concise' | 'balanced';

export enum ChatModeOptions {
  creative = 'h3imaginative',
  concise = 'h3precise',
  balanced = 'galileo',
}

async function getConversation() {
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.68';

  const response = await axios.get<IEdgeGPTResponse>(
    'https://www.bing.com/turing/conversation/create',
    {
      headers: {
        Cookie: process.env.BING_COOKIE,
        'User-Agent': userAgent,
      },
    },
  );

  if (response.data.result.value !== 'Success' && response.data.result.message) {
    throw new Error(response.data.result.message);
  }

  logger.info(`BingAI: Conversation created: ${response.data.conversationId}`);

  return response.data;
}

export async function getResponse(mode: ChatMode, textPrompt: string) {
  const conversation = await getConversation();

  return new Promise<string>((resolve, reject) => {
    const terminalChar = '';
    const wsURL = 'wss://sydney.bing.com/sydney/ChatHub';
    // Use prompt to get response from GPT WebSocket
    const wsClient = new ws(wsURL);

    let stage = 0;
    let isFulfilled = false;
    let wsPushInterval: NodeJS.Timeout;

    wsClient.on('open', () => {
      logger.info(`BingAI: WebSocket connection opened: ${conversation.conversationId}`);
      // Send initial message to GPT WebSocket
      wsClient.send(JSON.stringify({ protocol: 'json', version: 1 }) + terminalChar);
    });

    wsClient.on('error', error => {
      logger.error('BingAI: WebSocket error:', error);

      if (!isFulfilled) {
        isFulfilled = true;
        reject(new Error(`WebSocket error: ${error.toString()}`));
      }
    });

    wsClient.on('message', data => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const objects = data.toString().split(terminalChar);
      const response = JSON.parse(objects[0]);

      // If Type 2, then it is the final response
      if (response.type === 2) {
        const resultText = response.item.messages[1].text as string;

        isFulfilled = true;

        // Stop sending prompts
        clearInterval(wsPushInterval);

        // Close WebSocket connection
        wsClient.close();

        logger.info(`BingAI: Response received: ${conversation.conversationId}`);

        resolve(resultText);
      }

      // After receiving the initial message, send the prompt
      if (stage === 0) {
        logger.info('Sending prompt to GPT WebSocket');

        wsPushInterval = setInterval(() => {
          wsClient.send(JSON.stringify({ type: 6 }) + terminalChar);
        }, 5000);

        wsClient.send(JSON.stringify({ type: 6 }) + terminalChar);

        const traceId = crypto.randomBytes(16).toString('hex');

        // Send prompt
        wsClient.send(
          JSON.stringify({
            arguments: [
              {
                source: 'cib',
                optionsSets: [
                  'enablemm',
                  'deepleo',
                  'disable_emoji_spoken_text',
                  'nlu_direct_response_filter',
                  'responsible_ai_policy_235',
                  ChatModeOptions[mode],
                ],
                allowedMessageTypes: ['Chat'],
                sliceIds: [],
                traceId: traceId,
                isStartOfSession: true,
                message: {
                  locale: 'en-US',
                  market: 'en-US',
                  region: 'WW',
                  location: 'lat:47.639557;long:-122.128159;re=1000m;',
                  locationHints: [
                    {
                      Center: {
                        Latitude: 22.347_029_864_211_656,
                        Longitude: 114.194_725_602_113_41,
                      },
                      RegionType: 2,
                      SourceType: 11,
                    },
                    {
                      country: 'Hong Kong',
                      state: 'Central And Western District',
                      city: 'Central',
                      timezoneoffset: 8,
                      countryConfidence: 8,
                      cityConfidence: 8,
                      Center: { Latitude: 22.2794, Longitude: 114.1626 },
                      RegionType: 2,
                      SourceType: 1,
                    },
                  ],
                  // generate a timestamp in the format of '2023-05-05T22:43:45+08:00', can differ with +8:00
                  timestamp: new Date().toISOString().replace(/\.\d{3}/, ''),
                  author: 'user',
                  inputMethod: 'Keyboard',
                  text: `(DO NOT SEARCH, DO NOT INCLUDE any questions to ask me, response with the answer only) ${textPrompt}`,
                  messageType: 'Chat',
                },
                conversationSignature: conversation.conversationSignature,
                participant: { id: conversation.clientId },
                conversationId: conversation.conversationId,
              },
            ],
            invocationId: '0',
            target: 'chat',
            type: 4,
          }) + terminalChar,
        );

        stage = 1;
      }
    });
  });
}
