import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { vendorService } from '../services/api';

const joinLocationParts = (parts: Array<string | null | undefined>) =>
    parts
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .filter((part, index, list) => list.indexOf(part) === index)
        .join(', ');

const reverseGeocodeFromNominatim = async (latitude: number, longitude: number) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
                headers: {
                    Accept: 'application/json',
                    'Accept-Language': 'en',
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const address = data.address || {};

        return {
            address: data.display_name || joinLocationParts([
                address.house_number,
                address.road,
                address.neighbourhood || address.suburb,
                address.city || address.town || address.village,
                address.state,
                address.postcode,
            ]),
        };
    } catch (error) {
        return null;
    }
};

const reverseGeocodeFromBigDataCloud = async (latitude: number, longitude: number) => {
    try {
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return {
            address: joinLocationParts([
                data.locality,
                data.city,
                data.principalSubdivision,
                data.postcode,
                data.countryName,
            ]),
        };
    } catch (error) {
        return null;
    }
};

const reverseGeocodeAddress = async (latitude: number, longitude: number) => {
    if (Platform.OS !== 'web') {
        try {
            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            const first = geocode?.[0];
            if (first) {
                const address = joinLocationParts([
                    first.streetNumber,
                    first.street,
                    first.name,
                    first.subregion,
                    first.city,
                    first.region,
                    first.postalCode,
                ]);

                if (address) {
                    return address;
                }
            }
        } catch (error) {
            // Fall back to HTTP-based reverse geocoding below.
        }
    }

    const fallback =
        await reverseGeocodeFromNominatim(latitude, longitude) ||
        await reverseGeocodeFromBigDataCloud(latitude, longitude);

    return fallback?.address || `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;
};

export const detectVendorCurrentLocation = async () => {
    if (Platform.OS === 'web') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported on this device'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            });
        });

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const address = await reverseGeocodeAddress(latitude, longitude);

        return { latitude, longitude, address };
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
    });

    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;
    const address = await reverseGeocodeAddress(latitude, longitude);

    return { latitude, longitude, address };
};

export const syncVendorLiveLocation = async () => {
    const detectedLocation = await detectVendorCurrentLocation();
    const response = await vendorService.updateProfile({
        address: detectedLocation.address,
        latitude: detectedLocation.latitude,
        longitude: detectedLocation.longitude,
    });

    return response.data?.data || null;
};
