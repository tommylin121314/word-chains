import { useEffect, useState } from "react";

export default function Keyboard({ value, setValue, onSubmit, maxLength = 20, disabled = false }) {
  const [activeKey, setActiveKey] = useState(null);

  function addLetter(ch) {
    if (disabled) return;
    if ((value || "").length >= maxLength) return;
    setValue((s) => (s + ch).slice(0, maxLength));
  }

  function backspace() {
    if (disabled) return;
    setValue((s) => s.slice(0, -1));
  }

  function handleEnter() {
    if (disabled) return;
    if (typeof onSubmit === "function") onSubmit();
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (disabled) return;
      const key = e.key;
      if (key === "Enter") {
        e.preventDefault();
        setActiveKey('ENTER');
        handleEnter();
        return;
      }
      if (key === "Backspace") {
        e.preventDefault();
        setActiveKey('BACKSPACE');
        backspace();
        return;
      }
      const letter = key.toUpperCase();
      if (/^[A-Z]$/.test(letter)) {
        e.preventDefault();
        setActiveKey(letter);
        addLetter(letter);
      }
    }

    function onKeyUp(e) {
      const key = e.key;
      if (key === "Enter") setActiveKey(null);
      else if (key === "Backspace") setActiveKey(null);
      else {
        const letter = key.toUpperCase();
        if (/^[A-Z]$/.test(letter)) setActiveKey(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [disabled, value, maxLength]);

  return (
    <div className="keyboard-area">
      <div className="keyboard">
        <div className="keyboard-row">
          {"QWERTYUIOP".split("").map((k) => (
            <button
              key={k}
              className={`key ${activeKey === k ? 'active' : ''}`}
              onMouseDown={() => setActiveKey(k)}
              onMouseUp={() => setActiveKey(null)}
              onTouchStart={() => setActiveKey(k)}
              onTouchEnd={() => setActiveKey(null)}
              onClick={() => addLetter(k)}
            >{k}</button>
          ))}
        </div>
        <div className="keyboard-row">
          {"ASDFGHJKL".split("").map((k) => (
            <button
              key={k}
              className={`key ${activeKey === k ? 'active' : ''}`}
              onMouseDown={() => setActiveKey(k)}
              onMouseUp={() => setActiveKey(null)}
              onTouchStart={() => setActiveKey(k)}
              onTouchEnd={() => setActiveKey(null)}
              onClick={() => addLetter(k)}
            >{k}</button>
          ))}
        </div>
        <div className="keyboard-row">
          <button
            className={`key wide ${activeKey === 'BACKSPACE' ? 'active' : ''}`}
            onMouseDown={() => setActiveKey('BACKSPACE')}
            onMouseUp={() => setActiveKey(null)}
            onTouchStart={() => setActiveKey('BACKSPACE')}
            onTouchEnd={() => setActiveKey(null)}
            onClick={() => { backspace(); }}
          >&larr;</button>
          {"ZXCVBNM".split("").map((k) => (
            <button
              key={k}
              className={`key ${activeKey === k ? 'active' : ''}`}
              onMouseDown={() => setActiveKey(k)}
              onMouseUp={() => setActiveKey(null)}
              onTouchStart={() => setActiveKey(k)}
              onTouchEnd={() => setActiveKey(null)}
              onClick={() => addLetter(k)}
            >{k}</button>
          ))}
          <button
            className={`key wide ${activeKey === 'ENTER' ? 'active' : ''}`}
            onMouseDown={() => setActiveKey('ENTER')}
            onMouseUp={() => setActiveKey(null)}
            onTouchStart={() => setActiveKey('ENTER')}
            onTouchEnd={() => setActiveKey(null)}
            onClick={handleEnter}
          >⏎</button>
        </div>
      </div>
    </div>
  );
}
