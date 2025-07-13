const { GraphQLObjectType, GraphQLString, GraphQLFloat, GraphQLSchema } = require('graphql');
const gyms = require('./gyms');
const axios = require('axios');

const TeretanaType = new GraphQLObjectType({
  name: 'Teretana',
  fields: () => ({
    naziv: { type: GraphQLString },
    adresa: { type: GraphQLString },
    lat: { type: GraphQLFloat },
    lng: { type: GraphQLFloat },
    daljina: { type: GraphQLString }
  })
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

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    najblizaTeretana: {
      type: TeretanaType,
      args: {
        lat: { type: GraphQLFloat },
        lng: { type: GraphQLFloat }
      },
      resolve(parent, args) {
        const closest = gyms.reduce((prev, curr) => {
          const prevDist = getDistance(args.lat, args.lng, prev.lat, prev.lng);
          const currDist = getDistance(args.lat, args.lng, curr.lat, curr.lng);
          return currDist < prevDist ? curr : prev;
        });
        const distance = getDistance(args.lat, args.lng, closest.lat, closest.lng).toFixed(2);
        return {
          ...closest,
          daljina: distance > 1 ? `${distance}km` : `${distance * 1000}m`
        };
      }
    },
    najblizaTeretanaPoAdresi: {
      type: TeretanaType,
      args: {
        adresa: { type: GraphQLString }
      },
      async resolve(_, { address }) {
        const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: { q: address, format: 'json', limit: 1 },
          headers: { 'User-Agent': 'GymLocatorGraphQL/1.0' }
        });

        if (!geoRes.data.length) throw new Error('Adresa nije pronađena');

        const lat = parseFloat(geoRes.data[0].lat);
        const lng = parseFloat(geoRes.data[0].lon);

        const closest = gyms.reduce((prev, curr) => {
          const prevDist = getDistance(lat, lng, prev.lat, prev.lng);
          const currDist = getDistance(lat, lng, curr.lat, curr.lng);
          return currDist < prevDist ? curr : prev;
        });

        const distance = getDistance(lat, lng, closest.lat, closest.lng).toFixed(2);
        return {
          ...closest,
          daljina: distance > 1 ? `${distance}km` : `${distance * 1000}m`
        };
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery
});
