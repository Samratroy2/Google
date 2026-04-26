import React, { useState } from "react";
import Button from "../UI/Button";

function AIInputBox({ onParsed }) {
  const [text, setText] = useState("");

  return (
    <div>
      <textarea
        placeholder="Describe the need..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <Button onClick={() => onParsed(text)}>
        🤖 Analyze
      </Button>
    </div>
  );
}

export default AIInputBox;