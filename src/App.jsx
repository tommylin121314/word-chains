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
    const defaultGuessesRemaining = chain.map((w) => w.length).slice(1);
    return saved
      ? JSON.parse(saved)
      : { index: 0, guesses: [], completed: false, failed: false, guessesRemaining: defaultGuessesRemaining };
  });
  const [input, setInput] = useState("");

  // Persists state to localStorage on changes
  useEffect(() => {
    localStorage.setItem(todayKey, JSON.stringify(state));
  }, [state]);

  // Checks for win condition
  useEffect(() => {
    checkForWin();
  }, [state.index]);

  // Checks for loss condition
  useEffect(() => {
    checkForLoss();
  }, [state.guessesRemaining]);

  // Handles guess submission
  function submitGuess(e) {
    e.preventDefault();
    const guess = input.trim().toUpperCase();
    if (!guess || state.completed) return;

    const nextIndex = state.index + 1;

    console.log(state.guessesRemaining);

    // Handles a correct guess
    if (nextIndex < chain.length && guess === chain[nextIndex]) {
      const newIndex = nextIndex;
      setState((prev) => ({
        ...prev,
        index: newIndex,                                                          // Sets index to index of next word in chain
        guesses: [...prev.guesses, guess],                                        // Adds the correct guess to the list of guesses                       
      }));
    } 
    // Handles an incorrect guess
    else {
      if (nextIndex < chain.length) {
        setState((prev) => {
          return {
            ...prev,
            guesses: [...prev.guesses, guess],                                    // Adds the incorrect guess to the list of guesses
            guessesRemaining: prev.guessesRemaining.map((num, i) =>               // Decreases remaining guesses for the next word
              i === state.index ? num - 1 : num
            )
          };
        });
      } else {
        setState((prev) => ({ ...prev, guesses: [...prev.guesses, guess] }));
      }
    }

    console.log(state.guessesRemaining);
    setInput("");                                                                 // Resets input field for next guess
  }

  function resetState() {
    const defaultGuessesRemaining = chain.map((w) => w.length).slice(1);
    setState({ index: 0, guesses: [], completed: false, failed: false, guessesRemaining: defaultGuessesRemaining });
    setInput("");
  }

  function checkForWin() {
    if (!state.completed && state.index === chain.length - 1) {
      setState((prev) => ({ ...prev, completed: true }));
    }
  }

  function checkForLoss() {
    if (state.guessesRemaining[state.index] <= 0) {
      setState((prev) => ({ ...prev, failed: true }));
    }
  }

  return (
    <div className="app">
      <h1>Word Chain</h1>

      <div className="chain">
        {chain.map((word, i) => {
          const wordGuessed = i <= state.index;
          const isFirstWord = i === 0;
          const firstLetterRevealed = (i > 0 && state.guessesRemaining[i - 1] === 1);
          return (
            <div key={i} className="row" aria-label={`word ${i}`}>
              {Array.from({ length: word.length }).map((_, k) => {
                const isFirstLetter = k === 0 && firstLetterRevealed;
                const showLetter = (isFirstLetter || wordGuessed || isFirstWord);
                return (
                  <div
                    key={k}
                    className={`cell ${
                      isFirstWord ? "free-revealed" : 
                        isFirstLetter ? "free-revealed" : 
                            wordGuessed ? "guessed" : ""}`}
                    aria-hidden={!(showLetter)}
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
        onClick={() => resetState()}
        style={{"margin": "15px"}}
      >
        Reset
      </button>

    </div>
  );
}
