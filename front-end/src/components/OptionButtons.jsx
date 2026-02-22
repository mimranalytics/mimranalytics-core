import React from "react";
import "../css/OptionButtons.css";

const options = [
  "Governance",
  "Ownership",
  "Show effective ownership (indirect)"
];

const OptionButtons = () => {
  return (
    <div className="options-container">
      {options.map((opt, idx) => (
        <div key={idx} className="option-item">
          <div className="indicator"></div>
          <span className="option-label">{opt}</span>
        </div>
      ))}
    </div>
  );
};

export default OptionButtons;
