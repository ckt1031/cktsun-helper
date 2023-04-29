import Cron from 'croner';
import type { Client } from 'discord.js';
import { ActivityType, Events } from 'discord.js';

import type { DiscordEvent } from '../sturctures/event';
import checkRss from '../utils/check-rss-feed';
import logging from '../utils/logger';

function setDiscordStatus(client: Client) {
  const text = 'Life';

  // Watch $TEXT
  client.user?.setActivity(text, {
    type: ActivityType.Watching,
  });
}

export const event: DiscordEvent = {
  once: true,
  name: Events.ClientReady,
  run: async (client: Client) => {
    if (client.user) logging.info(`BOT: Logged in as ${client.user.tag}!`);

    setDiscordStatus(client);
    await checkRss(client);

    // recheck every 3 minute
    Cron(
      '*/3 * * * *',
      {
        timezone: 'Asia/Hong_Kong',
      },
      async () => {
        await checkRss(client);
      },
    );

    // recheck every 10 minute
    Cron(
      '*/10 * * * *',
      {
        timezone: 'Asia/Hong_Kong',
      },
      () => {
        setDiscordStatus(client);
      },
    );
  },
};
