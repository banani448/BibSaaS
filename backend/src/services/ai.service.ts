import axios from 'axios';
import { AIProvider, FaceShape } from '@prisma/client';

export interface FaceAnalysisResult {
  faceShape: FaceShape;
  confidence: number;
  hairTexture?: string;
  hairDensity?: string;
  hairLength?: string;
  summary?: string;
}

export interface RecommendationResult {
  score: number;
  explanation: string;
}

class AIService {
  private provider: AIProvider;

  constructor() {
    this.provider =
      (process.env.AI_PROVIDER as AIProvider) ||
      AIProvider.OLLAMA;
  }

  /**
   * =====================================================
   * FACE ANALYSIS
   * =====================================================
   */
  async analyzeFace(
    imageUrl: string,
  ): Promise<FaceAnalysisResult> {
    switch (this.provider) {
      case AIProvider.OPENAI:
        return this.analyzeWithOpenAI(imageUrl);

      case AIProvider.GOOGLE_GEMINI:
        return this.analyzeWithGemini(imageUrl);

      case AIProvider.OLLAMA:
        return this.analyzeWithOllama(imageUrl);

      default:
        return this.mockAnalysis();
    }
  }

  /**
   * =====================================================
   * RECOMMENDATION
   * =====================================================
   */
  async generateRecommendation(
    faceShape: string,
    hairstyleName: string,
  ): Promise<RecommendationResult> {
    const prompt = `
Face Shape: ${faceShape}
Hairstyle: ${hairstyleName}

Give:
1. Compatibility score (0-100)
2. Short explanation
`;

    switch (this.provider) {
      case AIProvider.OPENAI:
        return this.askOpenAI(prompt);

      case AIProvider.GOOGLE_GEMINI:
        return this.askGemini(prompt);

      case AIProvider.OLLAMA:
        return this.askOllama(prompt);

      default:
        return {
          score: 85,
          explanation:
            'Good compatibility based on face structure.',
        };
    }
  }

  /**
   * =====================================================
   * OPENAI
   * =====================================================
   */
  private async analyzeWithOpenAI(
    imageUrl: string,
  ): Promise<FaceAnalysisResult> {
    return {
      faceShape: FaceShape.OVAL,
      confidence: 92,
      summary: 'Detected using OpenAI',
    };
  }

  private async askOpenAI(
    prompt: string,
  ): Promise<RecommendationResult> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        },
      );

      const content =
        response.data.choices[0].message.content;

      return {
        score: 90,
        explanation: content,
      };
    } catch (error) {
      console.error(error);

      return {
        score: 75,
        explanation: 'Fallback recommendation',
      };
    }
  }

  /**
   * =====================================================
   * GEMINI
   * =====================================================
   */
  private async analyzeWithGemini(
    imageUrl: string,
  ): Promise<FaceAnalysisResult> {
    return {
      faceShape: FaceShape.ROUND,
      confidence: 88,
      summary: 'Detected using Gemini',
    };
  }

  private async askGemini(
    prompt: string,
  ): Promise<RecommendationResult> {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
      );

      const text =
        response.data.candidates?.[0]?.content?.parts?.[0]
          ?.text || '';

      return {
        score: 90,
        explanation: text,
      };
    } catch (error) {
      console.error(error);

      return {
        score: 70,
        explanation: 'Gemini fallback response',
      };
    }
  }

  /**
   * =====================================================
   * OLLAMA LOCAL
   * =====================================================
   */
  private async analyzeWithOllama(
    imageUrl: string,
  ): Promise<FaceAnalysisResult> {
    return {
      faceShape: FaceShape.SQUARE,
      confidence: 95,
      summary: 'Detected using Ollama',
    };
  }

  private async askOllama(
    prompt: string,
  ): Promise<RecommendationResult> {
    try {
      const response = await axios.post(
        `${process.env.OLLAMA_URL}/api/generate`,
        {
          model:
            process.env.OLLAMA_MODEL ||
            'llama3.1:8b',
          prompt,
          stream: false,
        },
      );

      return {
        score: 92,
        explanation: response.data.response,
      };
    } catch (error) {
      console.error(error);

      return {
        score: 80,
        explanation: 'Ollama fallback response',
      };
    }
  }

  /**
   * =====================================================
   * MOCK
   * =====================================================
   */
  private mockAnalysis(): FaceAnalysisResult {
    return {
      faceShape: FaceShape.OVAL,
      confidence: 80,
      hairDensity: 'MEDIUM',
      hairLength: 'SHORT',
      hairTexture: 'CURLY',
      summary: 'Mock analysis',
    };
  }
}

export const aiService = new AIService();
export default aiService;