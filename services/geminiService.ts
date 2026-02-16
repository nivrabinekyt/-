
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getGameInsights(gameName: string, category: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `נחשב כמומחה עולמי ל-Aiming. המשתמש משחק ב-${gameName} (${category}). 
      תן הסבר קצר ומקצועי (עד 3 משפטים) על אופי ה-Aim הנדרש במשחק הזה, 
      ומה היתרון של Sensitivity נמוך לעומת גבוה ספציפית כאן. השתמש במושגים מקצועיים בעברית.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "ניתוח המשחק אינו זמין כרגע, אך נמשיך בתהליך ה-PSA המקצועי.";
  }
}

export async function getFinalRecommendation(eDPI: number, cm360: number, gameName: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `המשתמש סיים תהליך PSA עבור ${gameName}. ה-eDPI הסופי שלו הוא ${eDPI} וה-cm/360 הוא ${cm360.toFixed(1)}.
      תן סיכום קצר המאשר את התוצאה והצע טיפ אחד לאימון Aim שיתאים לרגישות החדשה שלו.`,
    });
    return response.text;
  } catch (error) {
    return "מזל טוב! מצאת את הרגישות המושלמת שלך. מומלץ להתחיל להתאמן ב-Aim Labs או ב-Kovaak's כדי להתרגל.";
  }
}
