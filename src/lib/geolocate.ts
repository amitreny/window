import { placeId, type Place } from './openMeteo'

/** The device's position as a Place. Open-Meteo has no reverse geocoding, so it has no city name. */
export function currentPlace(): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This browser cannot share a location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          id: placeId(coords.latitude, coords.longitude),
          name: 'Current location',
          admin: `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      (error) =>
        reject(new Error(error.code === error.PERMISSION_DENIED ? 'Location permission was denied.' : "Couldn't get your location.")),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  })
}
