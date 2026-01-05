import { useEffect, useState, useRef } from "react";
import Keyboard from "./Keyboard";
import Chain from "./Chain";
import DateMenu from "./DateMenu";
import Navbar from "./Navbar";
import HelpModal from "./HelpModal";
import Srand from 'seeded-rand';
import CHAINS from "./chains";

// Map date to chain index deterministically so a contiguous block of
// `CHAINS.length` dates maps to all chains (no repeats).
function daysSinceEpoch(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return Math.floor(d.getTime() / 86400000);
}

function getChainForDate(dateStr) {
  const n = CHAINS.length;
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const dayNum = daysSinceEpoch(date);
  const idx = ((dayNum % n) + n) % n;
  return CHAINS[idx];
}

export default function App() {
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const chain = getChainForDate(selectedDate);
  const todayKey = `wordchain-${selectedDate}`;
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
  const [storageTick, setStorageTick] = useState(0);

  // Persists state to localStorage on changes
  // Persist the current state's data for the currently-selected date
  // Run only when `state` changes to avoid accidentally writing the
  // previous state's values into a new date key during a date switch.
  useEffect(() => {
    const key = `wordchain-${selectedDate}`;
    localStorage.setItem(key, JSON.stringify(state));
    setStorageTick((t) => t + 1);
  }, [state]);

  // Keep track of the previous selected date so that when the user
  // switches dates we explicitly save the *previous* state's data to
  // its own key. This prevents the following race: selectedDate
  // changes, a save running for the new key would write the previous
  // state's values into the new key (causing mismatched free-letter
  // indices). We save prev state here before loading the new date's
  // state.
  const prevSelectedRef = useRef(selectedDate);
  useEffect(() => {
    const prev = prevSelectedRef.current;
    if (prev !== selectedDate) {
      const prevKey = `wordchain-${prev}`;
      localStorage.setItem(prevKey, JSON.stringify(state));
      setStorageTick((t) => t + 1);
      prevSelectedRef.current = selectedDate;
    }
  }, [selectedDate]);

  // When the selected date changes, reload (or create) state for that date
  useEffect(() => {
    const saved = localStorage.getItem(todayKey);
    const freeLetters = generateFreeLetterIndices();
    const defaultGuessesRemaining = getWordLengths().slice(1);
    if (saved) {
      try {
        setState(JSON.parse(saved));
        return;
      } catch (e) {
        // fallthrough to default
      }
    }
    setState({ index: 0, guesses: [], completed: false, failed: false, guessesRemaining: defaultGuessesRemaining, freeLetters: freeLetters });
  }, [selectedDate]);

  // Close date menu when the selected date changes (user picked a date)
  useEffect(() => {
    if (showDateMenu) setShowDateMenu(false);
  }, [selectedDate]);

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
        guesses: [],                                                              // Resets guesses for next word             
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
    if (max < min) return new Set();
    const ints = new Set();
    for (let i = 0; i < max ** 3; i++) {
      if (ints.size >= n) break;
      const r = Math.floor(rnd.intInRange(min, max));
      if (!ints.has(r)) {
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
      // Avoid selecting the first or last letter as a free letter.
      const minIndex = 0;
      const maxIndex = Math.max(minIndex, wordLength - 2); // avoid last index (wordLength-1)
      const count = Math.floor(wordLength / 2);
      freeLetters.push([...randInts(count, minIndex, maxIndex)]);
    }
    return freeLetters;
  }

  // Generates array of word lengths in chain
  function getWordLengths() {
    return chain.map((word) => word.length);
  }

  // Days since Jan 1st (1-based)
  function daysSinceJan1(dateStr) {
    try {
      const d = new Date(dateStr + "T00:00:00");
      const start = new Date(d.getFullYear(), 0, 1);
      const msPerDay = 24 * 60 * 60 * 1000;
      return Math.floor((d - start) / msPerDay) + 1;
    } catch {
      return null;
    }
  }
  const dayNumber = daysSinceJan1(selectedDate) || "";


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
    <>
      <Navbar onToggleDate={() => setShowDateMenu((s) => !s)} onToggleHelp={() => setShowHelp((s) => !s)} />

      {(showDateMenu || showHelp) && (
        <div
          className="backdrop"
          onClick={() => {
            setShowDateMenu(false);
            setShowHelp(false);
          }}
          aria-hidden="true"
        />
      )}

      <div className="app">
        {showDateMenu && (
          <div className="date-overlay" role="dialog" aria-label="Date selector">
            <DateMenu selectedDate={selectedDate} setSelectedDate={setSelectedDate} refreshKey={storageTick} />
          </div>
        )}
        <div className="main">
        <h1>Word Chain {dayNumber ? `#${dayNumber}` : ""}</h1>

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

      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  );
}
