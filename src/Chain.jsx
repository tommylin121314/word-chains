import React from "react";

export default function Chain({ chain, state, input, flipRowIndex, shakeRow }) {
  return (
    <div className="chain">
      {chain.map((word, i) => {
        const wordGuessed = i <= state.index;
        const isFirstWord = i === 0;
        const perfectGuess = (i > 0 && state.guessesRemaining[i - 1] === word.length && wordGuessed);
        const isCurrentRow = i === state.index + 1;
        const inputChars = (input || "").toUpperCase().split("");
        const guessesRemaining = state.guessesRemaining[i - 1] || 0;

        return (
          <div key={i} className={`row${isCurrentRow && shakeRow ? ' shake-row' : ''}${i === flipRowIndex ? ' flip-row' : ''}`} aria-label={`word ${i}`}>
            {Array.from({ length: word.length }).map((_, k) => {
              const inputChar = isCurrentRow ? inputChars[k] || null : null;
              const highlightCell = isCurrentRow && (k >= (word.length - guessesRemaining));

              const freeIndices = state.freeLetters?.[i - 1] || [];
              const isFreeIndex = i > 0 && (freeIndices.includes ? freeIndices.includes(k) : Array.from(freeIndices).includes(k));
              const freeLetterRevealed = i > 0 && (word.length - guessesRemaining > k) && isFreeIndex;
              const freeLetterJustRevealed = freeLetterRevealed && (word.length - guessesRemaining === k + 1);

              const showLetter = (freeLetterRevealed || wordGuessed || isFirstWord || inputChar);
              const display = (inputChar ?? (showLetter ? word[k] : null));

              const classes = ["cell"];
              if (perfectGuess) classes.push("perfect-guess");
              else if (isFirstWord) classes.push("free-revealed");
              else if (freeLetterRevealed && !inputChar) classes.push("given");
              else if (wordGuessed) classes.push("guessed");

              if (isFreeIndex && !showLetter) classes.push("free-hint");
              if (highlightCell) classes.push("highlight-cell");
              if (freeLetterJustRevealed) classes.push("free-reveal-animate");

              return (
                <div
                  key={k}
                  className={classes.join(" ")}
                  aria-hidden={!(display)}
                >
                  {display}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
