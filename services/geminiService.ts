import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_ANALYSIS } from '../constants';
import { SessionReport } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReportFromTranscript = async (transcript: string): Promise<Partial<SessionReport>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following parent-teacher meeting transcript:\n\n${transcript}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  max: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                }
              }
            },
            swot: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } },
              }
            },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const chatWithInsight = async (history: {role: string, parts: {text: string}[]}[], message: string, context: string) => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are an educational insight assistant. Answer questions based on this meeting context: ${context}. Keep answers helpful and concise.`
    },
    history: history as any
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};
