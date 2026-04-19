import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => setCount((prev) => {
    const newCount = prev + 1;
    console.log(`Count: ${newCount} | ${new Date().toLocaleString()}`);
    return newCount;
  });

  const decrement = () => setCount((prev) => {
    const newCount = prev - 1;
    console.log(`Count: ${newCount} | ${new Date().toLocaleString()}`);
    return newCount;
  });

  return (
    <div className="counter">
      <h1>Counter</h1>
      <p className="count">{count}</p>

      {/* Button controls */}
      <div className="counter-buttons">
        <button className="counter-btn minus" onClick={decrement}>−</button>
        <button className="counter-btn plus" onClick={increment}>+</button>
      </div>

      {/* Hover controls */}
      <div className="hover-controls">
        <span className="hover-btn hover-out" onMouseOver={decrement}>Out −</span>
        <span className="hover-btn hover-over" onMouseOver={increment}>Over +</span>
      </div>
    </div>
  );
}

export default Counter;
