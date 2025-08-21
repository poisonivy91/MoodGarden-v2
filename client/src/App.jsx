import Entries from "./Entries.jsx";
import './App.css';
import About from "./About.jsx";
import Gallery from "./Gallery.jsx";

function App() {
  return (
     <div className="app-container">
      {/* 🌸 Sticky Navbar */}
      <nav className="navbar">
        <div className="logo">🌸 Mood Garden 🌸</div>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#entries">Entries</a></li>
          <li><a href="#gallery">Gallery</a></li>
        </ul>
      </nav>

      {/* 🌸 Sections */}
      <section id="about" className="section">
        <About />
      </section>

      <section id="entries" className="section">
        <Entries />
      </section>

      <section id="gallery" className="section">
        <Gallery />
      </section>
    </div>
  );
}

export default App;
