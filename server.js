const express = require('express');
const axios = require('axios');
const gyms = require('./gyms.json'); // tvoj JSON fajl sa teretanama

const app = express();

const fs = require('fs');
const path = require('path');
const marked = require('marked');


app.get('/', (req, res) => {
  const readmePath = path.join(__dirname, 'README.md');
  fs.readFile(readmePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Greška pri učitavanju README fajla');
    }
    const htmlContent = marked.parse(data);

    // Opcionalno, možeš poslati HTML u jednostavnom šablonu
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
