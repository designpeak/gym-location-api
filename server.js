const express = require('express');
const axios = require('axios');
const gyms = require('./gyms.json'); // tvoj JSON fajl sa teretanama

const app = express();

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
