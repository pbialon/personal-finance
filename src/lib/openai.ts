import OpenAI from 'openai';
import type { Category } from '@/types';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface CategorizationResult {
  category_id: string;
  confidence: number;
  display_name: string;
  description: string;
}

export async function categorizeTransaction(
  rawDescription: string,
  amount: number,
  date: string,
  counterpartyName: string | null,
  categories: Category[]
): Promise<CategorizationResult> {
  const openai = getOpenAIClient();

  const categoriesPrompt = categories
    .map(c => `- ${c.name} (ID: ${c.id}): ${c.ai_prompt || 'Brak opisu'}`)
    .join('\n');

  const prompt = `Kategoryzuj tę transakcję bankową.

Transakcja:
- Opis: ${rawDescription}
- Data: ${date}
- Odbiorca/Nadawca: ${counterpartyName || 'Nieznany'}

Dostępne kategorie:
${categoriesPrompt}

Odpowiedz TYLKO w formacie JSON (bez żadnego tekstu przed lub po):
{
  "category_id": "uuid kategorii",
  "confidence": 0.0-1.0,
  "display_name": "Czytelna, krótka nazwa transakcji (max 50 znaków)",
  "description": "Zwięzły opis transakcji po polsku, np. 'Zakupy spożywcze w Biedronce' lub 'Przelew za wynajem mieszkania' (max 200 znaków)"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Jesteś asystentem do kategoryzacji transakcji bankowych. Odpowiadasz tylko w formacie JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Brak odpowiedzi od OpenAI');
  }

  try {
    const result = JSON.parse(content) as CategorizationResult;

    const validCategory = categories.find(c => c.id === result.category_id);
    if (!validCategory) {
      const otherCategory = categories.find(c => c.name === 'Inne');
      if (otherCategory) {
        result.category_id = otherCategory.id;
        result.confidence = 0.5;
      }
    }

    return result;
  } catch {
    const otherCategory = categories.find(c => c.name === 'Inne');
    return {
      category_id: otherCategory?.id || categories[0].id,
      confidence: 0.3,
      display_name: rawDescription.slice(0, 50),
      description: rawDescription.slice(0, 200),
    };
  }
}
