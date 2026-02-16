
import React, { useState } from 'react';
import { GAMES, STARTING_BASES } from './constants';
import { GameProfile, PSASession, UserSettings } from './types';
import { getGameInsights, getFinalRecommendation } from './services/geminiService';

// --- Sub-components ---

const Header: React.FC = () => (
  <header className="py-8 px-4 text-center border-b border-zinc-800 bg-zinc-950/50 sticky top-0 z-50 backdrop-blur-md">
    <div className="flex items-center justify-center gap-3 mb-2">
      <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">AimSense Pro</h1>
    </div>
    <p className="text-zinc-400 text-sm">המחשבון המקצועי למציאת ה-Sensitivity המושלם</p>
  </header>
);

const GameSelector: React.FC<{ onSelect: (game: GameProfile) => void }> = ({ onSelect }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {GAMES.map((game) => (
      <button
        key={game.id}
        onClick={() => onSelect(game)}
        className="glass p-6 rounded-2xl text-right hover:border-blue-500 transition-all group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
        <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400">{game.name}</h3>
        <p className="text-xs text-zinc-500 mb-3 bg-zinc-800/50 inline-block px-2 py-1 rounded">
          {game.category}
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">{game.description}</p>
      </button>
    ))}
  </div>
);

const PSAWizard: React.FC<{ 
  session: PSASession, 
  onIterate: (choice: 'lower' | 'upper') => void,
  game: GameProfile,
  dpi: number
}> = ({ session, onIterate, game }) => {
  const currentIteration = session.iteration;
  const displayLower = (session.lower * game.defaultMultiplier).toFixed(3);
  const displayUpper = (session.upper * game.defaultMultiplier).toFixed(3);

  return (
    <div className="space-y-8 opacity-100 transition-opacity duration-500">
      <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="text-right">
          <span className="text-zinc-500 text-xs block mb-1">שלב</span>
          <span className="text-2xl font-bold text-blue-400">{currentIteration} / 6</span>
        </div>
        <div className="h-2 flex-1 mx-8 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full accent-gradient transition-all duration-500" 
            style={{ width: `${(currentIteration / 6) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
        <p className="text-sm text-blue-300">
          <strong>הוראות:</strong> הגדר את הרגישות במשחק ובצע בדיקת 180 מעלות על הפד. נסה לעשות פליק (Flick) למטרה דמיונית. האם עברת אותה (Over-flick) או לא הגעת אליה (Under-flick)? בחר את הערך שמרגיש הכי טבעי.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center p-8 glass rounded-2xl border-2 border-transparent hover:border-red-500/30 transition-all">
          <h4 className="text-zinc-500 text-sm mb-2 uppercase tracking-widest text-center">רגישות נמוכה</h4>
          <div className="text-4xl font-black mb-4">{displayLower}</div>
          <button 
            onClick={() => onIterate('lower')}
            className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl font-bold transition-all border border-red-500/30"
          >
            בחר נמוך
          </button>
        </div>

        <div className="text-center p-8 glass rounded-2xl border-2 border-transparent hover:border-green-500/30 transition-all">
          <h4 className="text-zinc-500 text-sm mb-2 uppercase tracking-widest text-center">רגישות גבוהה</h4>
          <div className="text-4xl font-black mb-4">{displayUpper}</div>
          <button 
            onClick={() => onIterate('upper')}
            className="w-full py-4 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded-xl font-bold transition-all border border-green-500/30"
          >
            בחר גבוה
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState<'welcome' | 'dpi' | 'game' | 'psa' | 'result'>('welcome');
  const [settings, setSettings] = useState<UserSettings>({ dpi: 800, gameId: 'cs2' });
  const [session, setSession] = useState<PSASession | null>(null);
  const [insights, setInsights] = useState<string>("");
  const [finalMsg, setFinalMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const selectedGame = GAMES.find(g => g.id === settings.gameId) || GAMES[0];

  const startPSA = async () => {
    setLoading(true);
    const base = STARTING_BASES[selectedGame.category];
    setSession({
      iteration: 1,
      base,
      lower: base * 0.5,
      upper: base * 1.5,
      history: []
    });
    
    const analysis = await getGameInsights(selectedGame.name, selectedGame.category);
    setInsights(analysis);
    setLoading(false);
    setStep('psa');
  };

  const handlePSAIteration = async (choice: 'lower' | 'upper') => {
    if (!session) return;
    const chosenValue = choice === 'lower' ? session.lower : session.upper;
    const newHistory = [...session.history, { iteration: session.iteration, chosen: choice, value: chosenValue }];

    if (session.iteration >= 6) {
      setStep('result');
      const finalSens = (session.lower + session.upper) / 2;
      const finalEdpi = finalSens * settings.dpi;
      const cm360 = (360 * 2.54) / (settings.dpi * finalSens * 0.022);
      
      setLoading(true);
      const msg = await getFinalRecommendation(finalEdpi, cm360, selectedGame.name);
      setFinalMsg(msg);
      setLoading(false);
      setSession(prev => prev ? { ...prev, base: finalSens, iteration: 7, history: newHistory } : null);
      return;
    }

    const newIteration = session.iteration + 1;
    let newBase;
    if (choice === 'lower') {
        newBase = (session.base + session.lower) / 2;
    } else {
        newBase = (session.base + session.upper) / 2;
    }

    const factor = 0.5 / Math.pow(1.2, newIteration - 1);
    setSession({
      iteration: newIteration,
      base: newBase,
      lower: newBase * (1 - factor),
      upper: newBase * (1 + factor),
      history: newHistory
    });
  };

  return (
    <div className="min-h-screen pb-20 bg-[#0a0a0c]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 mt-12">
        {step === 'welcome' && (
          <div className="text-center space-y-8 opacity-100 transition-opacity">
            <h2 className="text-5xl font-black mb-4 leading-tight">מצא את ה-Sensitivity<br /><span className="text-blue-500">האופטימלי שלך</span></h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              אל תעתיק סתם הגדרות של פרואים. השתמש בשיטת ה-PSA המדעית כדי למצוא את הנקודה המדויקת שבה היד שלך והכוונת הופכים לאחד.
            </p>
            <button 
              onClick={() => setStep('dpi')}
              className="accent-gradient px-12 py-5 rounded-2xl text-xl font-bold shadow-2xl shadow-blue-500/20 hover:scale-105 transition-transform"
            >
              בוא נתחיל
            </button>
            <div className="grid grid-cols-3 gap-4 pt-12">
              <div className="glass p-4 rounded-xl text-center">
                <div className="text-blue-400 font-bold text-xl">100%</div>
                <div className="text-xs text-zinc-500 uppercase">דיוק מתמטי</div>
              </div>
              <div className="glass p-4 rounded-xl text-center">
                <div className="text-violet-400 font-bold text-xl">6 שלבים</div>
                <div className="text-xs text-zinc-500 uppercase">תהליך מהיר</div>
              </div>
              <div className="glass p-4 rounded-xl text-center">
                <div className="text-emerald-400 font-bold text-xl">PRO</div>
                <div className="text-xs text-zinc-500 uppercase">סטנדרט עולמי</div>
              </div>
            </div>
          </div>
        )}

        {step === 'dpi' && (
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center">מה ה-DPI שלך?</h2>
            <div className="glass p-8 rounded-3xl space-y-6">
              <input 
                type="number" 
                value={settings.dpi}
                onChange={(e) => setSettings({ ...settings, dpi: parseInt(e.target.value) || 0 })}
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-3xl font-bold text-center focus:border-blue-500 outline-none transition-colors"
                placeholder="למשל: 800"
              />
              <div className="grid grid-cols-2 gap-3">
                {[400, 800, 1200, 1600].map(val => (
                  <button 
                    key={val}
                    onClick={() => setSettings({ ...settings, dpi: val })}
                    className={`p-3 rounded-lg border transition-all ${settings.dpi === val ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                  >
                    {val} DPI
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setStep('game')}
                className="w-full py-4 accent-gradient rounded-xl font-bold text-lg shadow-lg"
              >
                המשך לבחירת משחק
              </button>
            </div>
          </div>
        )}

        {step === 'game' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">בחר את זירת הקרב</h2>
            <GameSelector onSelect={(game) => {
              setSettings({ ...settings, gameId: game.id });
              startPSA();
            }} />
          </div>
        )}

        {step === 'psa' && session && (
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border-blue-500/20">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ניתוח מקצועי עבור {selectedGame.name}
              </h3>
              <p className="text-zinc-400 italic">"{insights || 'מנתח נתונים...'}"</p>
            </div>
            <PSAWizard session={session} onIterate={handlePSAIteration} game={selectedGame} dpi={settings.dpi} />
          </div>
        )}

        {step === 'result' && session && (
          <div className="max-w-2xl mx-auto space-y-8 opacity-100 transition-all duration-700">
            <div className="text-center">
              <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
                <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-black">הגענו ליעד!</h2>
              <p className="text-zinc-500">זהו ה-Sensitivity האידיאלי עבורך</p>
            </div>

            <div className="glass p-10 rounded-3xl relative overflow-hidden text-center border-green-500/30">
              <div className="text-7xl font-black text-white mb-2">
                {(session.base * selectedGame.defaultMultiplier).toFixed(3)}
              </div>
              <div className="text-green-400 font-bold tracking-widest uppercase mb-8 text-center">רגישות מומלצת</div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-zinc-200">{(session.base * settings.dpi).toFixed(0)}</div>
                  <div className="text-xs text-zinc-500 uppercase">eDPI</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-zinc-200">
                    {((360 * 2.54) / (settings.dpi * session.base * 0.022)).toFixed(1)}
                  </div>
                  <div className="text-xs text-zinc-500 uppercase">cm / 360°</div>
                </div>
              </div>
            </div>

            {finalMsg && (
              <div className="bg-blue-900/10 p-6 rounded-2xl border border-blue-500/20 text-blue-200 leading-relaxed text-right">
                {finalMsg}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-bold px-2">המרה למשחקים אחרים:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {GAMES.filter(g => g.id !== settings.gameId).map(game => (
                  <div key={game.id} className="glass p-4 rounded-xl flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">{game.name}</span>
                    <span className="font-bold text-blue-400">
                      {(session.base * game.defaultMultiplier).toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all text-zinc-300"
            >
              התחל מחדש
            </button>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xl font-bold text-white">מנתח נתונים ובונה פרופיל...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
