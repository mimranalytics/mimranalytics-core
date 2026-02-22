import React from "react";
import { FaSearch } from "react-icons/fa";
import "./css/SearchBar.css";

const SearchBar = () => {
  return (
    <div className="search-container">
      <input 
        type="text" 
        placeholder="search company" 
        className="search-input" 
      />
      <FaSearch className="search-icon" />
    </div>
  );
};

export default SearchBar;
