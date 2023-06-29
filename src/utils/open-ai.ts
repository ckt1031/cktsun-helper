import axios from 'axios';

const OPEN_AI_API_KEY = process.env.OPENAI_API_KEY;
const OPEN_AI_BASE_URL = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com';

export async function getOpenaiResponse({ prompt }: { prompt: string }) {
  const { data, status } = await axios.post(
    `${OPEN_AI_BASE_URL}/v1/chat/completions`,
    {
      stream: false,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-3.5-turbo-16k',
      max_tokens: 2500,
      temperature: 0.5,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPEN_AI_API_KEY}`,
      },
    },
  );

  if (status !== 200 || !data.choices[0].message?.content) {
    return null;
  }

  return data.choices[0].message?.content as string;
}
