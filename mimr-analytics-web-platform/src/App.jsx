import { useApp } from "./context/AppContext";
import HomePage    from "./pages/HomePage";
import AuthPage    from "./pages/AuthPage";
import ResultsPage from "./pages/ResultsPage";
import AboutPage   from "./pages/AboutPage";

export default function App() {
  const { page } = useApp();

  switch (page) {
    case "auth":    return <AuthPage />;
    case "results": return <ResultsPage />;
    case "about":   return <AboutPage />;
    default:        return <HomePage />;
  }
}
