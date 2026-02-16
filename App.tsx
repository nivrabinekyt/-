
import React, { useState, useMemo, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

// --- Consolidated Types & Constants ---
enum GameCategory {
  TAC_SHOOTER = 'Tac-Shooter',
  ARENA_TRACKING = 'Arena/Tracking'
}

interface GameProfile {
  id: string;
  name: string;
  category: GameCategory;
  defaultMultiplier: number;
  description: string;
}

const GAMES: GameProfile[] = [
  { id: 'cs2', name: 'Counter-Strike 2', category: GameCategory.TAC_SHOOTER, defaultMultiplier: 1.0, description: 'דיוק מקסימלי, החזקת זוויות ושימוש ב-Wrist/Arm.' },
  { id: 'valorant', name: 'Valorant', category: GameCategory.TAC_SHOOTER, defaultMultiplier: 0.314, description: 'דיוק קיצוני וחשיבות אדירה ל-Crosshair Placement.' },
  { id: 'apex', name: 'Apex Legends', category: GameCategory.ARENA_TRACKING, defaultMultiplier: 1.0, description: 'דורש Tracking מהיר, תנועה ורסטילית ושימוש בכל הפד.' },
  { id: 'marvel_rivals', name: 'Marvel Rivals', category: GameCategory.ARENA_TRACKING, defaultMultiplier: 3.333, description: 'Hero Shooter קצבי הדורש Tracking אינטנסיבי וסיבובים מהירים.' },
  { id: 'ow2', name: 'Overwatch 2', category: GameCategory.ARENA_TRACKING, defaultMultiplier: 3.333, description: 'משחק מהיר מאוד, דורש סיבובים של 180-360 מעלות.' },
  { id: 'warzone', name: 'Warzone', category: GameCategory.ARENA_TRACKING, defaultMultiplier: 3.333, description: 'שילוב של Tracking ותגובתיות מהירה בטווח קרוב.' }
];

const STARTING_BASES: Record<GameCategory, number> = {
  [GameCategory.TAC_SHOOTER]: 1.2,
  [GameCategory.ARENA_TRACKING]: 2.5
};

// --- API Service (Directly Integrated) ---
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getGameInsights = async (gameName: string, category: string) => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `נחשב כמומחה Aiming. המשתמש משחק ב-${gameName} (${category}). תן טיפ מקצועי קצר (2 משפטים) בעברית על אופי ה-Aim הנדרש.`,
    });
    return response.text;
  } catch { return "ניתוח מהיר: התמקד ב-Consistency ודיוק תנועה."; }
};

const getFinalRecommendation = async (eDPI: number, gameName: string) => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `המשתמש סיים PSA עבור ${gameName}. eDPI: ${eDPI}. תן ברכה קצרה וטיפ אימון אחד.`,
    });
    return response.text;
  } catch { return "מזל טוב! מצאת את הרגישות שלך. כעת התחל להתאמן ב-Aim Labs."; }
};

// --- Optimized Components ---
const Header = React.memo(() => (
  <header className="py-6 px-4 text-center border-b border-zinc-800 bg-zinc-950/50 sticky top-0 z-50 backdrop-blur-md">
    <div className="flex items-center justify-center gap-2 mb-1">
      <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center shadow-lg">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      </div>
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">AimSense Pro</h1>
    </div>
    <p className="text-zinc-500 text-xs">PSA Sensitivity Optimizer</p>
  </header>
));

export default function App() {
  const [step, setStep] = useState<'welcome' | 'dpi' | 'game' | 'psa' | 'result'>('welcome');
  const [settings, setSettings] = useState({ dpi: 800, gameId: 'cs2' });
  const [session, setSession] = useState<any>(null);
  const [insights, setInsights] = useState("");
  const [finalMsg, setFinalMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedGame = useMemo(() => GAMES.find(g => g.id === settings.gameId) || GAMES[0], [settings.gameId]);

  const handleStart = useCallback(async (gameId: string) => {
    setLoading(true);
    setSettings(prev => ({ ...prev, gameId }));
    const game = GAMES.find(g => g.id === gameId)!;
    const base = STARTING_BASES[game.category];
    setSession({ iteration: 1, base, lower: base * 0.5, upper: base * 1.5 });
    const text = await getGameInsights(game.name, game.category);
    setInsights(text || "");
    setLoading(false);
    setStep('psa');
  }, []);

  const handlePSAIteration = useCallback(async (choice: 'lower' | 'upper') => {
    if (!session) return;
    if (session.iteration >= 6) {
      setStep('result');
      setLoading(true);
      const finalSens = (session.lower + session.upper) / 2;
      const msg = await getFinalRecommendation(finalSens * settings.dpi, selectedGame.name);
      setFinalMsg(msg || "");
      setSession((s: any) => ({ ...s, base: finalSens }));
      setLoading(false);
      return;
    }

    const nextBase = choice === 'lower' ? (session.base + session.lower) / 2 : (session.base + session.upper) / 2;
    const factor = 0.5 / Math.pow(1.2, session.iteration);
    setSession({
      iteration: session.iteration + 1,
      base: nextBase,
      lower: nextBase * (1 - factor),
      upper: nextBase * (1 + factor)
    });
  }, [session, settings.dpi, selectedGame.name]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {step === 'welcome' && (
          <div className="text-center py-12 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black leading-tight text-white">ה-Sensitivity שלך<br/><span className="text-blue-500">מתחיל כאן</span></h2>
            <p className="text-zinc-400 text-lg max-w-lg mx-auto">מחשבון PSA מקצועי למציאת הרגישות המדויקת ליכולות הפיזיולוגיות שלך.</p>
            <button onClick={() => setStep('dpi')} className="accent-gradient px-10 py-4 rounded-xl text-lg font-bold shadow-xl hover:opacity-90 transition-all">בוא נתחיל</button>
          </div>
        )}

        {step === 'dpi' && (
          <div className="max-w-md mx-auto py-8">
            <h2 className="text-2xl font-bold text-center mb-6">הזן את ה-DPI שלך</h2>
            <div className="glass p-6 rounded-2xl space-y-4">
              <input type="number" value={settings.dpi} onChange={e => setSettings(s => ({ ...s, dpi: +e.target.value || 0 }))} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-3xl font-bold text-center focus:border-blue-500 outline-none" />
              <div className="grid grid-cols-4 gap-2">
                {[400, 800, 1600, 3200].map(v => <button key={v} onClick={() => setSettings(s => ({ ...s, dpi: v }))} className={`p-2 text-xs rounded border ${settings.dpi === v ? 'border-blue-500 text-blue-400' : 'border-zinc-800 text-zinc-500'}`}>{v}</button>)}
              </div>
              <button onClick={() => setStep('game')} className="w-full py-4 accent-gradient rounded-xl font-bold">המשך</button>
            </div>
          </div>
        )}

        {step === 'game' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GAMES.map(g => (
              <button key={g.id} onClick={() => handleStart(g.id)} className="glass p-5 rounded-xl text-right hover:border-blue-500 group transition-all">
                <h3 className="text-lg font-bold group-hover:text-blue-400">{g.name}</h3>
                <p className="text-sm text-zinc-500">{g.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === 'psa' && session && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between glass p-4 rounded-xl">
              <span className="text-zinc-500">שלב {session.iteration} מתוך 6</span>
              <div className="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full accent-gradient transition-all" style={{width: `${(session.iteration/6)*100}%`}} /></div>
            </div>
            {insights && <p className="text-sm text-zinc-400 italic bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">{insights}</p>}
            <div className="grid grid-cols-2 gap-4">
              {[ { l: 'נמוך', v: session.lower, c: 'lower' }, { l: 'גבוה', v: session.upper, c: 'upper' } ].map(opt => (
                <div key={opt.c} className="glass p-6 rounded-2xl text-center space-y-4">
                  <span className="text-zinc-500 text-xs block">{opt.l}</span>
                  <div className="text-3xl font-black">{(opt.v * selectedGame.defaultMultiplier).toFixed(3)}</div>
                  <button onClick={() => handlePSAIteration(opt.c as any)} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold">בחר</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'result' && session && (
          <div className="text-center max-w-xl mx-auto space-y-8">
            <div className="glass p-10 rounded-3xl border-green-500/20">
              <h2 className="text-xl text-zinc-400 mb-2">הרגישות המושלמת שלך:</h2>
              <div className="text-6xl font-black text-white mb-6">{(session.base * selectedGame.defaultMultiplier).toFixed(3)}</div>
              <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-6">
                <div><div className="text-2xl font-bold">{(session.base * settings.dpi).toFixed(0)}</div><div className="text-xs text-zinc-500 uppercase">eDPI</div></div>
                <div><div className="text-2xl font-bold">{((360*2.54)/(settings.dpi*session.base*0.022)).toFixed(1)}</div><div className="text-xs text-zinc-500 uppercase">cm / 360°</div></div>
              </div>
            </div>
            {finalMsg && <p className="text-zinc-400 bg-blue-900/10 p-4 rounded-xl text-right">{finalMsg}</p>}
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-zinc-400">התחל מחדש</button>
          </div>
        )}
      </main>

      {loading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
