# Gym Locator REST API

Jednostavan REST API u Node.js koji omogućava pretragu najbliže teretane na osnovu geografske lokacije (lat/lng) ili adrese. Podaci o teretanama se čitaju iz lokalnog `gyms.json` fajla, daljina se racuna preko haversine formule i prikazuje udaljenost vazdušnom linijom.


## 📁 Struktura

```
├── index.js          // Glavna logika REST API-ja
├── gyms.json          // Lista od 190 teretana sa koordinatama
├── package.json
```

---

## 📌 Endpointi

### `GET /najblizaTeretana?lat={latitude}&lng={longitude}`

Vrati najbližu teretanu na osnovu geografskih koordinata.

**Primer:**

```
GET https://gym-location-api.onrender.com/najblizaTeretana?lat=44.81&lng=20.46
```

**Odgovor:**

```json
{
  "naziv": "Non Stop fitness",
  "adresa": "Sarajevska 66, Beograd 111207, Serbia",
  "daljina": "1.16 km"
}
```

---

### `GET /najblizaTeretanaPoAdresi?adresa={ulica i grad}`

Vrši geokodiranje adrese putem OpenStreetMap Nominatim API-ja i vraća najbližu teretanu.

**Primer:**

```
GET https://gym-location-api.onrender.com/najblizaTeretanaPoAdresi?adresa=Jove+Ilića+154,+Beograd
```

**Odgovor:**

```json
{
  "naziv": "Ahilej Vozdovac",
  "adresa": "Vojvode Stepe 207, Beograd, Serbia",
  "daljina": "180 m"
}
```

---

## 🧪 Testiranje

Preporučene alatke:

- [Postman](https://www.postman.com/)
- `curl`
- [RapidAPI](https://rapidapi.com/vexxtv123-2_SwxkIh61E/api/najbliza-teretana-fon1)

---

## 🛠 Tehnologije

- Node.js  
- Express.js  
- Axios  
- OpenStreetMap (Nominatim)
