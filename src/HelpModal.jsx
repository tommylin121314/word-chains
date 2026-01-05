import React from "react";

export default function HelpModal({ onClose }) {
  return (
    <div className="help-modal" role="dialog" aria-label="How to play" onClick={onClose}>
      <div className="help-content" onClick={(e) => e.stopPropagation()}>
        <h2>How to play</h2>
        <p>1. Find words connected with the previous.</p>
        <div className="chain">
            {['SNOW', 'MAN'].map((word, i) => {
                return (
                <div key={i} className={`row`} aria-label={`word ${i}`}>
                    {Array.from({ length: word.length }).map((_, k) => {
                    return (<div key={k} className="cell guessed help-example">{word[k]}</div>);
                    })}
                </div>
                );
            })}
        </div>
        <p>2. Uncover free letters as you play.</p>
        <p>3. Use your guesses wisely.</p>
        <p>4. Complete the chain to win!</p>
      </div>
    </div>
  );
}
