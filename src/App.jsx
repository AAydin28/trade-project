import React, { useEffect, useState } from "react";

const translationCache = {};

const App = () => {
  const [rawProducts, setRawProducts] = useState([]);
  const [translatedProducts, setTranslatedProducts] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ürünleri çekme
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("https://fakestoreapi.com/products");
        const data = await res.json();
        setRawProducts(data);
      } catch (err) {
        setError("Ürünler alınamadı");
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Metni çevir işlemiad
  const translateText = async (text) => {
    if (translationCache[text]) return translationCache[text];

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=en|tr`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const translated = data.responseData.translatedText;

      if (
        translated.includes("MYMEMORY WARNING") ||
        data.responseDetails?.includes("exceeded")
      ) {
        return text;
      }

      translationCache[text] = translated;
      return translated;
    } catch {
      return text;
    }
  };

  useEffect(() => {
    const translateProducts = async () => {
      try {
        const translated = await Promise.all(
          rawProducts.map(async (product) => {
            const translatedTitle = await translateText(product.title);
            const translatedCategory = await translateText(product.category);
            const translatedDescription = await translateText(
              product.description
            );
            return {
              ...product,
              translatedTitle,
              translatedCategory,
              translatedDescription,
            };
          })
        );
        setTranslatedProducts(translated);
      } catch (err) {
        setError("Çeviri işlemi sırasında hata oluştu");
      }
    };

    if (rawProducts.length > 0) {
      translateProducts();
    }
  }, [rawProducts]);

  // Döviz kuru alma
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const res = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD"
        );
        const data = await res.json();
        setExchangeRate(data.rates.TRY);
        setLoading(false);
      } catch (err) {
        setError("Döviz kuru alınamadı");
        setLoading(false);
      }
    };
    fetchExchangeRate();
  }, []);

  if (loading) return <p>Yükleniyor...</p>;
  if (error) return <p>Hata: {error}</p>;

  return (
    <div>
      <h1>Ürün Listesi</h1>
      {translatedProducts.map((product) => (
        <div
          key={product.id}
          style={{
            marginBottom: "2rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "1rem",
            maxWidth: "400px",
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
        >
          <img
            src={product.image}
            alt={product.translatedTitle}
            style={{ width: "100%", maxHeight: "250px", objectFit: "contain" }}
          />
          <h3>{product.translatedTitle}</h3>
          <p>
            <strong>Kategori:</strong> {product.translatedCategory}
          </p>
          <p style={{ maxHeight: "120px", overflowY: "auto" }}>
            <strong>Açıklama:</strong> {product.translatedDescription}
          </p>
          <p>
            <strong>Fiyat:</strong> {(product.price * exchangeRate).toFixed(2)}{" "}
            TL
          </p>
        </div>
      ))}
    </div>
  );
};

export default App;
