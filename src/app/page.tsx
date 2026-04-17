'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type ESLLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type GameMode = 'dice' | 'freeChoice';

const ALL_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

const LETTER_DIFFICULTY: Record<string, 'easy' | 'medium' | 'hard' | 'veryHard'> = {
  A: 'easy', B: 'easy', C: 'easy', D: 'easy', E: 'easy',
  F: 'easy', G: 'medium', H: 'easy', I: 'medium', J: 'hard',
  K: 'medium', L: 'easy', M: 'easy', N: 'medium', O: 'medium',
  P: 'easy', Q: 'veryHard', R: 'easy', S: 'easy', T: 'easy',
  U: 'hard', V: 'hard', W: 'medium', X: 'veryHard', Y: 'hard',
  Z: 'veryHard',
};

const DIFFICULTY_STYLES: Record<string, { bg: string; rolling: string; label: string; badge: string; points: string }> = {
  easy:     { bg: 'bg-gradient-to-br from-green-400 to-emerald-600',  rolling: 'bg-gradient-to-br from-yellow-300 to-green-400',  label: 'Easy',      badge: 'bg-green-100 text-green-800',   points: '1 pt'  },
  medium:   { bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',  rolling: 'bg-gradient-to-br from-orange-300 to-yellow-400', label: 'Medium',    badge: 'bg-yellow-100 text-yellow-800', points: '2 pts' },
  hard:     { bg: 'bg-gradient-to-br from-orange-500 to-red-500',     rolling: 'bg-gradient-to-br from-red-300 to-orange-400',    label: 'Hard',      badge: 'bg-orange-100 text-orange-800', points: '3 pts' },
  veryHard: { bg: 'bg-gradient-to-br from-red-600 to-purple-700',     rolling: 'bg-gradient-to-br from-purple-400 to-red-500',    label: 'Very Hard', badge: 'bg-red-100 text-red-800',       points: '4 pts' },
};

const CARD_COUNTS: Record<ESLLevel, number> = {
  A1: 10, A2: 12, B1: 14, B2: 14, C1: 14, C2: 14,
};

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;
    const tones = [
      { freq: 880, start: 0,    dur: 0.3 },
      { freq: 660, start: 0.35, dur: 0.3 },
      { freq: 440, start: 0.7,  dur: 0.6 },
    ];
    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.4, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
  } catch (e) {
    console.error('Audio error:', e);
  }
}

interface DiceProps {
  letter: string;
  isRolling: boolean;
  onRoll: () => void;
}

function Dice({ letter, isRolling, onRoll }: DiceProps) {
  const difficulty = letter ? LETTER_DIFFICULTY[letter] : 'easy';
  const styles = DIFFICULTY_STYLES[difficulty];
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onRoll}
        disabled={isRolling}
        className={`w-32 h-32 rounded-2xl shadow-2xl flex items-center justify-center text-6xl font-bold transition-all ${
          isRolling ? `${styles.rolling} animate-bounce` : `${styles.bg} hover:scale-110`
        } text-white cursor-pointer`}
      >
        {letter || '?'}
      </button>
      {letter && !isRolling && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles.badge}`}>
          {styles.label} &middot; {styles.points}
        </span>
      )}
    </div>
  );
}

export default function ESLLetterChallenge() {
  const [eslLevel, setEslLevel] = useState<ESLLevel>('B1');
  const [currentCardIndex, setCurrentCardIndex] = useState<Record<ESLLevel, number>>({
    A1: 1, A2: 1, B1: 1, B2: 1, C1: 1, C2: 1,
  });
  const [currentCategories, setCurrentCategories] = useState<string[]>([]);
  const [letter1, setLetter1] = useState<string>('');
  const [letter2, setLetter2] = useState<string>('');
  const [isRolling1, setIsRolling1] = useState(false);
  const [isRolling2, setIsRolling2] = useState(false);
  const [showSecondDice, setShowSecondDice] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('dice');
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInput, setTimerInput] = useState('180');
  const [isLoading, setIsLoading] = useState(true);
  const [hideCategories, setHideCategories] = useState(false);
  const alreadyAlertedRef = useRef(false);

  const loadCategories = async (level: ESLLevel, cardNumber: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/categories/${level}/card${cardNumber}.txt`);
      if (!response.ok) throw new Error(`Failed to load card ${cardNumber} for level ${level}`);
      const text = await response.text();
      setCurrentCategories(text.split('\n').filter((line: string) => line.trim() !== ''));
    } catch (error) {
      console.error('Error loading categories:', error);
      setCurrentCategories(['Error loading categories. Please refresh the page.']);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(eslLevel, currentCardIndex[eslLevel]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      alreadyAlertedRef.current = false;
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && !alreadyAlertedRef.current) {
      alreadyAlertedRef.current = true;
      setIsTimerRunning(false);
      playAlertSound();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const rollDice = useCallback((diceNum: 1 | 2) => {
    const isRolling = diceNum === 1 ? isRolling1 : isRolling2;
    if (isRolling) return;
    const setRolling = diceNum === 1 ? setIsRolling1 : setIsRolling2;
    const setLetter = diceNum === 1 ? setLetter1 : setLetter2;
    setRolling(true);
    let count = 0;
    const rollInterval = setInterval(() => {
      setLetter(ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)]);
      count++;
      if (count > 15) {
        clearInterval(rollInterval);
        setRolling(false);
      }
    }, 100);
  }, [isRolling1, isRolling2]);

  const changeLevel = async (level: ESLLevel) => {
    setEslLevel(level);
    const currentIndex = currentCardIndex[level];
    const totalCards = CARD_COUNTS[level];
    let newIndex = Math.floor(Math.random() * totalCards) + 1;
    if (totalCards > 1) {
      while (newIndex === currentIndex) newIndex = Math.floor(Math.random() * totalCards) + 1;
    }
    setCurrentCardIndex({ ...currentCardIndex, [level]: newIndex });
    await loadCategories(level, newIndex);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    alreadyAlertedRef.current = false;
    const inputValue = parseInt(timerInput);
    setTimeLeft(inputValue > 0 ? inputValue : 180);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timerColor = timeLeft <= 10 ? 'text-red-600' : timeLeft <= 30 ? 'text-orange-500' : 'text-gray-800';

  const selectedDifficulty = selectedLetter ? LETTER_DIFFICULTY[selectedLetter] : null;
  const selectedStyles = selectedDifficulty ? DIFFICULTY_STYLES[selectedDifficulty] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">

      {/* Timer - enlarged */}
      <div className="fixed top-4 right-4 bg-white rounded-2xl shadow-xl p-5 z-10 min-w-[210px]">
        <div className={`text-7xl font-bold text-center mb-3 tabular-nums leading-none ${timerColor}`}>
          {formatTime(timeLeft)}
        </div>
        {timeLeft === 0 && (
          <div className="text-center text-red-600 font-bold text-sm mb-2 animate-pulse">Time&apos;s Up!</div>
        )}
        <div className="flex gap-2 mb-3 justify-center">
          <button onClick={() => setIsTimerRunning(true)}  className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-semibold">Start</button>
          <button onClick={() => setIsTimerRunning(false)} className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-semibold">Pause</button>
          <button onClick={resetTimer}                     className="px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold">Reset</button>
        </div>
        <div className="flex gap-2 justify-center">
          <input
            type="number"
            value={timerInput}
            onChange={(e) => setTimerInput(e.target.value)}
            className="w-20 px-2 py-1 border rounded-lg text-sm text-center"
            placeholder="Seconds"
          />
          <span className="text-xs self-center text-gray-500">sec</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-6 text-gray-800">ESL Letter Challenge</h1>

        {/* Mode toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow p-1.5 flex gap-1 border border-gray-200">
            <button
              onClick={() => setGameMode('dice')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                gameMode === 'dice' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dice Mode
            </button>
            <button
              onClick={() => { setGameMode('freeChoice'); setSelectedLetter(''); }}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                gameMode === 'freeChoice' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Free Choice Mode
            </button>
          </div>
        </div>

        {/* DICE MODE */}
        {gameMode === 'dice' && (
          <>
            <div className="flex justify-center items-start gap-8 mb-4 flex-wrap">
              <Dice letter={letter1} isRolling={isRolling1} onRoll={() => rollDice(1)} />
              {showSecondDice && (
                <Dice letter={letter2} isRolling={isRolling2} onRoll={() => rollDice(2)} />
              )}
            </div>

            <div className="flex justify-center gap-3 mb-3 flex-wrap">
              {(['easy','medium','hard','veryHard'] as const).map(d => (
                <span key={d} className={`text-xs font-semibold px-2 py-1 rounded-full ${DIFFICULTY_STYLES[d].badge}`}>
                  {DIFFICULTY_STYLES[d].label} = {DIFFICULTY_STYLES[d].points}
                </span>
              ))}
            </div>

            <p className="text-center text-gray-600 mb-4">Click a dice to roll a letter!</p>

            <div className="flex justify-center mb-8">
              <button
                onClick={() => setShowSecondDice(prev => !prev)}
                className={`px-5 py-2 rounded-full font-semibold text-sm shadow transition-all ${
                  showSecondDice
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                }`}
              >
                {showSecondDice ? 'Remove Second Dice' : 'Add Second Dice'}
              </button>
            </div>
          </>
        )}

        {/* FREE CHOICE MODE */}
        {gameMode === 'freeChoice' && (
          <div className="mb-8">
            <p className="text-center text-gray-600 mb-5 font-medium">
              Students choose any letter. Harder letters earn more points!
            </p>

            {selectedLetter && selectedStyles && selectedDifficulty && (
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className={`w-28 h-28 rounded-2xl shadow-2xl flex items-center justify-center ${selectedStyles.bg} text-white`}>
                  <span className="text-6xl font-bold">{selectedLetter}</span>
                </div>
                <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${selectedStyles.badge}`}>
                  {selectedStyles.label} &mdash; Worth {selectedStyles.points}
                </span>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-5">
              <div className="flex justify-center flex-wrap gap-2">
                {ALL_LETTERS.map(letter => {
                  const diff = LETTER_DIFFICULTY[letter];
                  const s = DIFFICULTY_STYLES[diff];
                  const isSelected = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(letter)}
                      className={`w-12 h-12 rounded-xl font-bold text-xl text-white shadow transition-all hover:scale-110 active:scale-95 ${s.bg} ${
                        isSelected ? 'ring-4 ring-offset-2 ring-purple-500 scale-110' : ''
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center gap-4 flex-wrap">
                {(['easy','medium','hard','veryHard'] as const).map(d => (
                  <span key={d} className={`text-xs font-semibold px-3 py-1 rounded-full ${DIFFICULTY_STYLES[d].badge}`}>
                    {DIFFICULTY_STYLES[d].label} = {DIFFICULTY_STYLES[d].points}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-2xl font-semibold text-gray-800">
              Categories
              <span className="text-base font-normal text-gray-500 ml-2">
                (Level: {eslLevel} &mdash; Card {currentCardIndex[eslLevel]}/{CARD_COUNTS[eslLevel]})
              </span>
            </h2>
            <button
              onClick={() => setHideCategories(prev => !prev)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all border ${
                hideCategories
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300'
              }`}
            >
              {hideCategories ? 'Show Categories' : 'Blank for Whiteboard'}
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading categories...</div>
          ) : hideCategories ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentCategories.map((_: string, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 h-14 flex items-center">
                  <span className="font-semibold text-gray-300">{index + 1}.</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentCategories.map((category: string, index: number) => (
                <div key={index} className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border-l-4 border-purple-500">
                  <span className="font-semibold text-gray-700">{index + 1}. {category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ESL Level Selector */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Select ESL Level (Click to change card)</h3>
          <div className="flex gap-3 flex-wrap justify-center">
            {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as ESLLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => changeLevel(level)}
                disabled={isLoading}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  eslLevel === level ? 'bg-purple-600 text-white shadow-lg scale-105' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 text-center text-gray-700">
          <p className="font-medium">
            {gameMode === 'dice'
              ? 'Dice Mode: Roll the dice to get a letter, then find words starting with that letter for each category!'
              : 'Free Choice Mode: Students pick any letter. The harder the letter, the more points they can earn!'}
          </p>
        </div>
      </div>
    </div>
  );
}
