import { useEffect, useState } from "react";

const CHAINS = [
  ["COFFEE", "CUP", "HANDLE", "BAR", "EXAM", "PROCTOR"],
  ["PHONE", "BATTERY", "CHARGER", "CABLE", "INTERNET", "SPEED"],
  ["BIRTH", "DAY", "DRINKING", "FOUNTAIN", "PEN", "PAL"],
  ["MINUTE", "HAND", "WATCH", "BAND", "WAGON", "WHEEL"],
  ["SPARKLING", "WATER", "LOG", "CABIN", "FEVER", "DREAM"],
  ["SCHOOL", "BUS", "DRIVER", "LICENSE", "PLATE", "NUMBER"],
  ["HOUSE", "TOUR", "GUIDE", "RAIL", "ROAD", "TRIP"],
  ["SALAD", "DRESSING", "ROOM", "KEY", "CHAIN", "SAW"]
];

// Fetches word chain based on current date
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

  // Initializes state from localStorage or default values
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(todayKey);
    return saved
      ? JSON.parse(saved)
      : { index: 0, guesses: [], completed: false, failed: false, revealedLetters: {}, guessesRemaining: chain[0].length - 1};
  });

  const [input, setInput] = useState("");

  useEffect(() => {
    localStorage.setItem(todayKey, JSON.stringify(state));
  }, [state]);


  // Handles guess submission
  function submitGuess(e) {
    e.preventDefault();
    const guess = input.trim().toUpperCase();
    if (!guess || state.completed) return;

    const nextIndex = state.index + 1;

    if (nextIndex < chain.length && guess === chain[nextIndex]) {
      const newIndex = nextIndex;
      setState((prev) => ({
        ...prev,
        index: newIndex,                                                                  // Sets index to index of next word in chain
        guesses: [...prev.guesses, guess],                                                // Adds the correct guess to the list of guesses                       
        completed: newIndex === chain.length - 1,                                         // Checks if the chain is completed
        guessesRemaining: newIndex < chain.length ? chain[newIndex + 1].length - 1 : 0    // Sets guessesRemaining for the next word
      }));
    } else {
      if (nextIndex < chain.length) {
        setState((prev) => {
          const revealed = { ...(prev.revealedLetters || {}) };
          const current = revealed[nextIndex] || 0;
          if (current < chain[nextIndex].length - 1) revealed[nextIndex] = current + 1;
          return {
            ...prev,
            revealedLetters: revealed,                                                    // Updates revealed letters for the next word
            guesses: [...prev.guesses, guess],                                            // Adds the incorrect guess to the list of guesses
            failed: current + 1 === chain[nextIndex].length,                              // Fails the game if all letters are revealed
            guessesRemaining: prev.guessesRemaining - 1                                   // Decreases guesses remaining by 1
          };
        });
      } else {
        setState((prev) => ({ ...prev, guesses: [...prev.guesses, guess] }));
      }
    }

    setInput(""); // Clear input field                                                    // Resets input field for next guess
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

      {!state.completed && !state.failed && (
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

      {state.failed && (
        <div className="complete">
          You're a dumbass!
        </div>
      )}

      <button 
        onClick={() => setState({ index: 0, guesses: [], completed: false, failed: false, revealedLetters: {} })}
        style={{"margin": "15px"}}
      >
        Reset
      </button>

    </div>
  );
}
