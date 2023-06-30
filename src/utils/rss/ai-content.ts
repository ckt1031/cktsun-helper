import extractArticle from '../extract-article';
import { getOpenaiResponse } from '../open-ai';

interface AiContent {
  isClickBait: boolean;
  scores: {
    scale: number; // Weight: 2.5
    magnitude: number; // Weight: 3
    potential: number; // Weight: 2
    novelty: number; // Weight: 1.5
    credibility: number; // Weight: 2
  };
  summary: string;
}

export default async function getAiContent(url: string) {
  const article = await extractArticle(url);

  if (!article.title || !article.published) {
    return undefined;
  }

  const sourceHost = new URL(url).hostname;

  const task = `Tasks: Analyze this article, provide a score with the following significance score, and summarize the content with a short text and a professional tone, beware to remove unnecessary information, DO NOT MENTION THE standards below in the summary text such as credibility and scale, only care about the article content.
  Response Requirement: ONLY JSON, { isClickBait, scores: { scale: magnitude, potential, novelty, credibility }, summary } no extra fields
  Standards: (Score from 0 to 10)
  - scale: how many people the event affected
  - magnitude: how big the effect
  - potential: how likely it is that the event will cause bigger events
  - novelty: how unexpected or unique was the event
  - credibility: how credible is the source
  Status:
  isClickBait: whether the title is clickbait or not. (Boolean)
`;

  const prompt = `
  ${task}
  Title:${article.title}
  Source:${sourceHost}
  Date:${article.published}
  Content:${article.parsedTextContent}
  `;

  const response = await getOpenaiResponse({ prompt });

  // Check if response is valid and json
  if (!response || typeof response !== 'string') {
    return undefined;
  }

  // Parse response
  const parsedResponse: AiContent = JSON.parse(response);

  const weightedMean = Number(
    (
      (parsedResponse.scores.scale * 2.5 +
        parsedResponse.scores.magnitude * 3 +
        parsedResponse.scores.potential * 2 +
        parsedResponse.scores.novelty * 1.5 +
        parsedResponse.scores.credibility * 2) /
      11
    ).toFixed(2),
  );

  const summary = parsedResponse.summary;

  return { weightedMean, summary, isClickBait: parsedResponse.isClickBait };
}
