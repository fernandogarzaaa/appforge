import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import axios from "axios";
const ArtGallery = ({ apiUrl }) => {
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchArtworks = async () => {
            setLoading(true);
            try {
                const response = await axios.get(apiUrl);
                setArtworks(response.data);
            }
            catch (error) {
                console.error(error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchArtworks();
    }, [apiUrl]);
    return (_jsx("div", { children: loading ? (_jsx("p", { children: "Loading..." })) : (artworks.map((artwork, index) => (_jsx("img", { src: artwork.image, alt: `Artwork ${index + 1}` }, index)))) }));
};
export default ArtGallery;
