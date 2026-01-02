import { useEffect, useState } from "react";
import Keyboard from "./Keyboard";
import Chain from "./Chain";
import Srand from 'seeded-rand';

const CHAINS = [
  ["COFFEE", "CUP", "HANDLE", "BAR", "EXAM", "PROCTOR"],
  ["BIRTH", "DAY", "DRINKING", "FOUNTAIN", "PEN", "PAL"],
  ["MINUTE", "HAND", "WATCH", "BAND", "WAGON", "WHEEL"],
  ["SCHOOL", "BUS", "DRIVER", "LICENSE", "PLATE", "NUMBER"],
  ["HOUSE", "TOUR", "GUIDE", "RAIL", "ROAD", "TRIP"],
  ["PHONE", "BATTERY", "CHARGER", "CABLE", "INTERNET", "SPEED"],
  ["SPARKLING", "WATER", "LOG", "CABIN", "FEVER", "DREAM"],
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
  const rnd = new Srand(todayKey);

  // Initializes state from localStorage or default values
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(todayKey);
    const freeLetters = generateFreeLetterIndices();
    const defaultGuessesRemaining = getWordLengths().slice(1);
    return saved
      ? JSON.parse(saved)
      : { index: 0, guesses: [], completed: false, failed: false, guessesRemaining: defaultGuessesRemaining, freeLetters: freeLetters };
  });
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [flipRowIndex, setFlipRowIndex] = useState(null);

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

  // Handles guess submission (can be called from form submit or programmatically)
  function submitGuess(e) {
    if (e && e.preventDefault) e.preventDefault();
    const guess = input.trim().toUpperCase();
    if (!isValidGuess(guess)) {
      // Trigger a brief shake on the current row to indicate wrong guess
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 700);
      return;
    }

    const nextIndex = state.index + 1;

    // Handles a correct guess
    if (nextIndex < chain.length && guess === chain[nextIndex]) {
      const newIndex = nextIndex;
      setState((prev) => ({
        ...prev,
        index: newIndex,                                                          // Sets index to index of next word in chain
        guesses: [...prev.guesses, guess],                                        // Adds the correct guess to the list of guesses                       
      }));
      // Play a flip animation for the newly-guessed row
      setFlipRowIndex(newIndex);
      setTimeout(() => setFlipRowIndex(null), 600);
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
        // Trigger a brief shake on the current row to indicate wrong guess
        setShakeRow(true);
        setTimeout(() => setShakeRow(false), 700);
      } else {
        setState((prev) => ({ ...prev, guesses: [...prev.guesses, guess] }));
      }
    }

    setInput("");                                                                 // Resets input field for next guess
  }

  // Resets game state to initial values
  function resetState() {
    const freeLetters = generateFreeLetterIndices();
    const defaultGuessesRemaining = getWordLengths().slice(1);
    setState({ index: 0, guesses: [], completed: false, failed: false, guessesRemaining: defaultGuessesRemaining, freeLetters: freeLetters });
    setInput("");
  }

  // Checks for win condition
  function checkForWin() {
    if (!state.completed && state.index === chain.length - 1) {
      setState((prev) => ({ ...prev, completed: true }));
    }
  }

  // Checks for loss condition
  function checkForLoss() {
    if (state.guessesRemaining[state.index] <= 0) {
      setState((prev) => ({ ...prev, failed: true }));
    }
  }

  // Checks if guess is valid based on expected length
  function isValidGuess(guess) {
    const isCorrectLength = (guess.length === (chain[state.index + 1]?.length || 0))
    const isNewGuess = !state.guesses.includes(guess);
    return isCorrectLength && isNewGuess;
  }

  // Helper function to generate positions of free letters
  // Picks up to `n` distinct indices in [min, max] (inclusive), avoiding adjacent indices.
  function randInts(n, min, max) {
    const ints = new Set();
    for (let i = 0; i < max * n; i++) {
      if (ints.size >= n) break;
      const r = Math.floor(rnd.intInRange(min, max));
      if (!ints.has(r) && !ints.has(r - 1) && !ints.has(r + 1)) {
        ints.add(r);
      }
    }
    return ints;
  }

  // Generates array of free letter indices for each word in chain
  function generateFreeLetterIndices() {
    const freeLetters = [];
    for (let i = 1; i < chain.length; i++) {
      const wordLength = chain[i].length;
      freeLetters.push([...randInts(Math.floor(wordLength / 5) + 1, wordLength <= 3 ? 0 : 1, wordLength - 1)]);
    }
    return freeLetters;
  }

  // Generates array of word lengths in chain
  function getWordLengths() {
    return chain.map((word) => word.length);
  }


  // Build a textual representation of the current gameboard for sharing
  function buildShareText() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
    const lines = [`Word Chain — ${today}\n`];
    const greenBox = "🟩";
    const blueBox = "🟦";
    const blackBox = "⬛";

    // Add first word (given)
    lines.push(greenBox.repeat(chain[0].length));

    // Add subsequent words
    for (let i = 1; i < chain.length; i++) {
      const firstLetterRevealed = state.guessesRemaining[i - 1] === 1;
      const wordGuessed = i <= state.index;
      const perfectGuess = (i > 0 && state.guessesRemaining[i - 1] === chain[i].length && wordGuessed);
      if (wordGuessed) {
        if (perfectGuess) {
          lines.push(chain[i].split("").map(() => blueBox).join(""));
        }
        else {
          lines.push(firstLetterRevealed ? blackBox + greenBox.repeat(chain[i].length - 1) : greenBox.repeat(chain[i].length));
        }
      }
      else {
        lines.push(blackBox.repeat(chain[i].length));
      }
    }

    // Calculate and add accuracy
    const totalGuesses = chain.reduce((acc, _, i) => (i === 0 || i > state.index + 1) ? acc : acc + (chain[i].length), 0);
    const guessesRemaining = state.guessesRemaining.reduce((acc, num, i) => (i > state.index) ? acc: acc + num, 0);
    lines.push(`\nAccuracy: ${Math.round(guessesRemaining * 100 / totalGuesses)}%`);

    // Add win/loss message
    if (state.completed) {
      lines.push(`\n🎉 I Won! 😝`);
    }
    else if (state.failed) {
      lines.push(`\n😔 I Lost! 😭`);
    }
    
    return lines.join("\n");
  }

  async function handleShare() {
    const text = buildShareText();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Copy failed", err);
      alert("Unable to copy to clipboard");
    }
  }


  return (
    <div className="app">
      
      <h1>Word Chain</h1>

      <Chain
        chain={chain}
        state={state}
        input={input}
        flipRowIndex={flipRowIndex}
        shakeRow={shakeRow}
      />

      {!state.completed && !state.failed && (
        <Keyboard
          value={input}
          setValue={setInput}
          onSubmit={submitGuess}
          maxLength={chain[state.index + 1]?.length || 20}
          disabled={state.completed || state.failed}
        />
      )}

      {state.completed && (
        <div className="complete">
          🎉 You Won! 😝
        </div>
      )}

      {state.failed && (
        <div className="complete">
          😔 You Lost! 😭
        </div>
      )}

      {(state.completed || state.failed) && (
        <div>
          <button className="share-btn" onClick={handleShare} aria-label="Share results">{copied ? "Copied!" : "Share"}</button>
        </div>
      )}

      <button 
        onClick={() => resetState()}
        className="reset-btn"
      >
        Reset
      </button>

    </div>
  );
}
