import React from "react";
import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Navbar />

      <main className="main-content">
        <h2 className="main-heading">
          EXPLORE COMPANIES STRUCTURE : AUDITING MADE SIMPLE
        </h2>
        <SearchBar />
      </main>
    </div>
  );
}

export default App;
