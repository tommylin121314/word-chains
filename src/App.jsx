import { useEffect, useState } from "react";

// --- DAILY PUZZLES (STATIC FOR NOW) ---
const CHAINS = [
  ["HOUSE", "TOUR", "GUIDE", "RAIL", "ROAD", "TRIP"],
  ["COFFEE", "CUP", "HANDLE", "BAR", "EXAM", "PROCTOR"],
  ["SCHOOL", "BUS", "DRIVER", "LICENSE", "PLATE", "NUMBER"],
  ["PHONE", "BATTERY", "CHARGER", "CABLE", "INTERNET", "SPEED"],
  ["SALAD", "DRESSING", "ROOM", "KEY", "CHAIN", "SAW"],
  ["SPARKLING", "WATER", "LOG", "CABIN", "FEVER", "DREAM"],
  ["MINUTE", "HAND", "WATCH", "BAND", "WAGON", "WHEEL"],
  ["BIRTH", "DAY", "DRINKING", "FOUNTAIN", "PEN", "PAL"]
];

// --- DATE-BASED PUZZLE SELECTION ---
function getTodayChain() {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash << 5) - hash + today.charCodeAt(i);
  }
  return CHAINS[Math.abs(hash) % CHAINS.length];
}

export default function App() {
  const chain = getTodayChain();
  const todayKey = `wordchain-${new Date().toISOString().slice(0, 10)}`;

  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(todayKey);
    return saved
      ? JSON.parse(saved)
      : { index: 0, guesses: [], completed: false, revealedLetters: {} };
  });

  const [input, setInput] = useState("");

  useEffect(() => {
    localStorage.setItem(todayKey, JSON.stringify(state));
  }, [state]);

  function submitGuess(e) {
    e.preventDefault();
    const guess = input.trim().toUpperCase();
    if (!guess || state.completed) return;

    const nextIndex = state.index + 1;

    if (nextIndex < chain.length && guess === chain[nextIndex]) {
      const newIndex = nextIndex;
      setState((prev) => ({
        ...prev,
        index: newIndex,
        guesses: [...prev.guesses, guess],
        completed: newIndex === chain.length - 1
      }));
    } else {
      // incorrect guess: reveal one more letter of the next word
      if (nextIndex < chain.length) {
        setState((prev) => {
          const revealed = { ...(prev.revealedLetters || {}) };
          const current = revealed[nextIndex] || 0;
          if (current < chain[nextIndex].length - 1) revealed[nextIndex] = current + 1;
          return {
            ...prev,
            revealedLetters: revealed,
            guesses: [...prev.guesses, guess]
          };
        });
      } else {
        // guess after last (shouldn't happen) — just record it
        setState((prev) => ({ ...prev, guesses: [...prev.guesses, guess] }));
      }
    }

    setInput("");
  }

  return (
    <div className="app">
      <h1>Word Chain</h1>

      <div className="chain">
        {chain.map((word, i) => {
          const wordGuessed = i <= state.index;
          const isFirstWord = i === 0;
          const revealedCount = (state.revealedLetters && state.revealedLetters[i]) || 0;
          return (
            <div key={i} className="row" aria-label={`word ${i}`}>
              {Array.from({ length: word.length }).map((_, k) => {
                const isFirstLetter = k === 0 && revealedCount > 0;
                const letterRevealed = isFirstWord || isFirstLetter ? true : k < revealedCount;
                const showLetter = (isFirstLetter || letterRevealed || wordGuessed || isFirstWord);
                return (
                  <div
                    key={k}
                    className={`cell ${
                      isFirstWord ? "free-revealed" : isFirstLetter 
                        ? "free-revealed" : letterRevealed 
                          ? "revealed" : wordGuessed 
                            ? "guessed" : ""}`}
                    aria-hidden={!(letterRevealed)}
                  >
                    {showLetter ? word[k] : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {!state.completed && (
        <form onSubmit={submitGuess}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={15}
            autoFocus
            placeholder="Next word..."
          />
        </form>
      )}

      {state.completed && (
        <div className="complete">
          🎉 Chain complete!
        </div>
      )}
    </div>
  );
}
