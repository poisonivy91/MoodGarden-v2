import { useEffect, useState } from "react";
import { getEntries } from "./api";

function Gallery() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    getEntries().then(setEntries);
  }, []);

  return (
    <div className="page gallery">
      <h1>🌺 Mood Flower Gallery 🌺</h1>
      <div className="gallery-grid">
        {entries.map(entry =>
          entry.flowerImageUrl ? (
            <img
              key={entry.id}
              src={entry.flowerImageUrl}
              alt={entry.mood}
              className="gallery-flower"
            />
          ) : null
        )}
      </div>
    </div>
  );
}

export default Gallery;