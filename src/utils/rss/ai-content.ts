import extractArticle from '../extract-article';
import { getOpenaiResponse } from '../open-ai';

interface AiContent {
  userRequirementSatified: boolean;
  scores: {
    scale: number; // Weight: 3
    magnitude: number; // Weight: 2.5
    potential: number; // Weight: 2
    novelty: number; // Weight: 1.5
    credibility: number; // Weight: 1
  };
  summary: string;
}

export default async function getAiContent(
  url: string,
  tagName: string,
  aiFilteringRequirement?: string,
) {
  try {
    const article = await extractArticle(url);

    if (!article.title || !article.published) {
      return undefined;
    }

    const sourceHost = new URL(url).hostname;

    const task = `Tasks: Analyze this article, provide a score with the following significance score, and summarize the content with a short text and a professional tone, beware to remove unnecessary information, DO NOT MENTION THE Significance scores below in the summary text such as credibility and scale, only care about the article content.
  Response Requirement: ONLY JSON: { userRequirementSatified, scores: { scale: magnitude, potential, novelty, credibility }, summary } no extra fields
  Significance Scores: (Score from 0 to 10)
  - scale: how many group of people from the event will be affected.
  - magnitude: how big the effect will be to the society and affect to the given topic.
  - potential: how likely it is that the event will cause bigger events, new trend.
  - novelty: how unexpected or unique, will this be the top news of the day or the first time it happened
  - credibility: how credible is the source
  Status:
  userRequirementSatified: whether the user requirement is satisfied. (Boolean) (True if N/A or empty)
`;

    const prompt = `
  ${task}
  Title: ${article.title}
  Source: ${sourceHost}
  Tag/Topic: ${tagName}
  Requirement: ${aiFilteringRequirement ?? 'N/A'}
  Date: ${article.published}
  Content: ${article.parsedTextContent}
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
        (parsedResponse.scores.scale * 3 +
          parsedResponse.scores.magnitude * 2.5 +
          parsedResponse.scores.potential * 2 +
          parsedResponse.scores.novelty * 1.5 +
          parsedResponse.scores.credibility * 1) /
        10
      ).toFixed(2),
    );

    const summary = parsedResponse.summary;

    return {
      weightedMean,
      summary,
      userRequirementSatified: parsedResponse.userRequirementSatified,
    };
  } catch (error) {
    console.log(error);
    return undefined;
  }
}
