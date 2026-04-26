import React from "react";
import Button from "../UI/Button";

function ParsedPreview({ data, onConfirm, onEdit }) {
  if (!data) return null;

  return (
    <div>
      <h3>AI Parsed Need</h3>

      <p><b>Type:</b> {data.type}</p>
      <p><b>Qty:</b> {data.qty}</p>
      <p><b>Urgency:</b> {data.urgency}</p>
      <p><b>Location:</b> {data.location}</p>
      <p><b>Volunteers:</b> {data.requiredVolunteers}</p>

      <Button onClick={onConfirm}>🚀 Confirm</Button>
      <Button onClick={onEdit}>✏️ Edit</Button>
    </div>
  );
}

export default ParsedPreview;