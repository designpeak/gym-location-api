const express = require('express');
const axios = require('axios');
const gyms = require('./gyms.json');

const app = express();

const readme = `
# Gym Locator REST API

Jednostavan REST API u Node.js koji omogućava pretragu najbliže teretane na osnovu geografske lokacije (lat/lng) ili adrese. Podaci o teretanama se čitaju iz lokalnog \`gyms.json\` fajla, daljina se racuna preko haversine formule i prikazuje udaljenost vazdušnom linijom.


## 📁 Struktura

\`\`\`
├── index.js          // Glavna logika REST API-ja
├── gyms.json          // Lista od 190 teretana sa koordinatama
├── package.json
\`\`\`

---

## 📌 Endpointi

### \`GET /najblizaTeretana?lat={latitude}&lng={longitude}\`

Vrati najbližu teretanu na osnovu geografskih koordinata.

**Primer:**

\`\`\`
GET https://gym-location-api.onrender.com/najblizaTeretana?lat=44.81&lng=20.46
\`\`\`

**Odgovor:**

\`\`\`json
{
  "naziv": "Non Stop fitness",
  "adresa": "Sarajevska 66, Beograd 111207, Serbia",
  "daljina": "1.16 km"
}
\`\`\`

---

### \`GET /najblizaTeretanaPoAdresi?adresa={ulica i grad}\`

Vrši geokodiranje adrese putem OpenStreetMap Nominatim API-ja i vraća najbližu teretanu.

**Primer:**

\`\`\`
GET https://gym-location-api.onrender.com/najblizaTeretanaPoAdresi?adresa=Jove+Ilića+154,+Beograd
\`\`\`

**Odgovor:**

\`\`\`json
{
  "naziv": "Ahilej Vozdovac",
  "adresa": "Vojvode Stepe 207, Beograd, Serbia",
  "daljina": "180 m"
}
\`\`\`

---

## 🧪 Testiranje

Preporučene alatke:

- [Postman](https://www.postman.com/)
- \`curl\`
- [RapidAPI](https://rapidapi.com/vexxtv123-2_SwxkIh61E/api/najbliza-teretana-fon1)

---

## 🛠 Tehnologije

- Node.js  
- Express.js  
- Axios  
- OpenStreetMap (Nominatim)
`;

const marked = require('marked');


app.get('/', (req, res) => {
    const htmlContent = marked.parse(readme);

    res.send(`
      <!DOCTYPE html>
      <html lang="sr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>README</title>
        <style>
          body { max-width: 800px; margin: 40px auto; font-family: Arial, sans-serif; line-height: 1.6; padding: 0 20px; }
          pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
          code { font-family: monospace; background: #f4f4f4; padding: 2px 4px; }
          h1,h2,h3,h4,h5,h6 { color: #333; }
          a { color: #0366d6; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `);
});



function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.get('/najblizaTeretana', (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query parameters are required' });
  }
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  const closest = gyms.reduce((prev, curr) => {
    const prevDist = getDistance(userLat, userLng, prev.lat, prev.lng);
    const currDist = getDistance(userLat, userLng, curr.lat, curr.lng);
    return currDist < prevDist ? curr : prev;
  });

     const teretana = {
      "naziv": closest.naziv,
      "adresa": closest.adresa,
      "daljina": closest.daljina
    }

  const distance = getDistance(userLat, userLng, closest.lat, closest.lng);
  const daljina = distance > 1 ? `${distance.toFixed(2)} km` : `${(distance * 1000).toFixed(0)} m`;

  res.json({ ...teretana, daljina });
});

app.get('/najblizaTeretanaPoAdresi', async (req, res) => {
  const { adresa } = req.query;
  if (!adresa) return res.status(400).json({ error: 'adresa query parameter is required' });

  try {
    const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: adresa, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'GymLocatorREST/1.0' }
    });

    if (!geoRes.data.length) return res.status(404).json({ error: 'Adresa nije pronađena' });

    const lat = parseFloat(geoRes.data[0].lat);
    const lng = parseFloat(geoRes.data[0].lon);

    const closest = gyms.reduce((prev, curr) => {
      const prevDist = getDistance(lat, lng, prev.lat, prev.lng);
      const currDist = getDistance(lat, lng, curr.lat, curr.lng);
      return currDist < prevDist ? curr : prev;
    });

    const teretana = {
      "naziv": closest.naziv,
      "adresa": closest.adresa,
      "daljina": closest.daljina
    }

    const distance = getDistance(lat, lng, closest.lat, closest.lng);
    const daljina = distance > 1 ? `${distance.toFixed(2)} km` : `${(distance * 1000).toFixed(0)} m`;

    res.json({ ...teretana, daljina });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`REST API radi na http://localhost:${PORT}`));
