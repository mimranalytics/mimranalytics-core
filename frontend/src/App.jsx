import React from "react";
import Navbar from "./components/NavBar";
import SearchBar from "./components/SearchBar";
import OptionButtons from "./components/OptionButtons";
import "./css/App.css";

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <SearchBar />
        <OptionButtons />
      </main>
    </div>
  );
};

export default App;
