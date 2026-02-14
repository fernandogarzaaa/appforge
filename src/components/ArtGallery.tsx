import React, { useState, useEffect } from "react";
import axios from "axios";

interface ArtGalleryProps {
  apiUrl: string;
}

const ArtGallery: React.FC<ArtGalleryProps> = ({ apiUrl }) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      try {
        const response = await axios.get(apiUrl);
        setArtworks(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtworks();
  }, [apiUrl]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        artworks.map((artwork, index) => (
          <img
            key={index}
            src={artwork.image}
            alt={`Artwork ${index + 1}`}
          />
        ))
      )}
    </div>
  );
};

export default ArtGallery;