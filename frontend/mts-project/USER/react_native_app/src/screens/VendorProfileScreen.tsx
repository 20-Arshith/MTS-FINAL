import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getServiceMeta } from '../utils/serviceHelpers';
import api from '../utils/api';

const { width } = Dimensions.get('window');



const VendorProfileScreen = ({ navigation, route }) => {
  const initialVendorName = route.params?.vendorName || 'CleanCo Pro';
  const vendorType = route.params?.type || 'Home Cleaning';
  const initialRating = route.params?.rating || 4.8;
  const initialReviews = route.params?.reviews || 125;
  const initialPhone = route.params?.phone || '+919876543210';
  const serviceId = route.params?.serviceId;
  const vendorId = route.params?.vendorId;
  const initialPrice = route.params?.price;

  const [loading, setLoading] = useState(true);
  const [notAvailable, setNotAvailable] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'gallery' | 'reels'>('services');
  const [vendorDetails, setVendorDetails] = useState({
    vendorName: initialVendorName,
    rating: Number(initialRating),
    reviews: Number(initialReviews),
    vendorPhone: initialPhone,
    logo_url: null,
    banner_url: null,
    description: null,
    address: null,
    gallery: [],
    reels: [],
  });

  useEffect(() => {
    const fetchVendorData = async () => {
      setLoading(true);
      setNotAvailable(false);
      try {
        const requests: Promise<any>[] = [];
        // [0] profile
        requests.push(vendorId ? api.get(`/users/vendors/${vendorId}/profile`) : Promise.resolve(null));
        // [1] services
        requests.push(vendorId ? api.get(`/users/vendors/${vendorId}/services`) : Promise.resolve(null));
        // [2] service details (if coming from search/direct link)
        requests.push(serviceId ? api.get(`/users/services/${serviceId}`) : Promise.resolve(null));

        const [profileResult, servicesResult, serviceDetailsResult] = await Promise.allSettled(requests);
        const profileRes = profileResult.status === 'fulfilled' ? profileResult.value : null;
        const servicesRes = servicesResult.status === 'fulfilled' ? servicesResult.value : null;
        const serviceDetailsRes = serviceDetailsResult.status === 'fulfilled' ? serviceDetailsResult.value : null;

        const profileData = profileRes?.data?.data;
        if (profileData) {
          setVendorDetails((prev) => ({
            ...prev,
            vendorName: profileData.business_name || prev.vendorName,
            rating: profileData.rating || prev.rating,
            reviews: profileData.review_count || prev.reviews,
            logo_url: profileData.logo_url,
            banner_url: profileData.banner_url,
            description: profileData.description,
            address: profileData.address,
            gallery: profileData.gallery || [],
            reels: profileData.reels || [],
          }));
        }

        const fetchedServices = servicesRes?.data?.data?.length
          ? servicesRes.data.data.map((service) => ({
              id: service.id,
              name: service.service_title,
              price: service.price_min ? Number(service.price_min) : 0,
              duration: service.price_max ? `Up to ₹${Number(service.price_max)}` : 'Standard',
              description: service.description || `${service.category?.category_name || 'Service'} service`,
              category: service.category?.category_name || vendorType,
              image_urls: service.image_urls || [],
            }))
          : [];

        const selectedServiceDetails = serviceDetailsRes?.data?.data;
        if (selectedServiceDetails && !profileData) {
          setVendorDetails((prev) => ({
            ...prev,
            vendorName: selectedServiceDetails.vendor?.business_name || prev.vendorName,
            rating: selectedServiceDetails.rating || prev.rating,
            reviews: selectedServiceDetails.review_count || prev.reviews,
            vendorPhone: selectedServiceDetails.vendor?.mobile || prev.vendorPhone,
            logo_url: selectedServiceDetails.vendor?.logo_url,
            banner_url: selectedServiceDetails.vendor?.banner_url,
          }));
        }

        if (fetchedServices.length > 0) {
          setServices(fetchedServices);
        } else if (selectedServiceDetails) {
          setServices([
            {
              id: selectedServiceDetails.id,
              name: selectedServiceDetails.service_title,
              price: selectedServiceDetails.price_min ? Number(selectedServiceDetails.price_min) : Number(initialPrice) || 0,
              duration: selectedServiceDetails.price_max
                ? `Up to ₹${Number(selectedServiceDetails.price_max)}`
                : 'Standard',
              description: selectedServiceDetails.description || 'Scheduled service',
              category: selectedServiceDetails.category?.category_name || vendorType,
              image_urls: selectedServiceDetails.image_urls || [],
            },
          ]);
        } else {
          setServices([]);
          if (vendorId) {
            setNotAvailable(true);
          }
        }
      } catch (error) {
        setServices([]);
        if (vendorId) {
          setNotAvailable(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [initialPrice, initialReviews, initialRating, serviceId, vendorId, vendorType]);

  const primaryServiceName = services[0]?.category || services[0]?.name || vendorType;
  const meta = useMemo(() => getServiceMeta(primaryServiceName), [primaryServiceName]);

  const handleBookNow = (preselectedService?: any) => {
    navigation.navigate('BookingConfirm', {
      vendorId,
      vendorName: vendorDetails.vendorName,
      vendorPhone: vendorDetails.vendorPhone,
      vendorType: primaryServiceName,
      rating: vendorDetails.rating,
      reviews: vendorDetails.reviews,
      services,
      preselectedService: preselectedService || services[0],
    });
  };

  const openServiceGallery = (images: string[] = []) => {
    setGalleryImages(images.filter(Boolean));
  };

  const closeServiceGallery = () => {
    setGalleryImages([]);
  };

  if (!loading && notAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FB', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <View style={{ height: 96, backgroundColor: meta.color, justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginLeft: 16, width: 38, height: 38, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
        </View>
        <View style={{ margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#F1F3F5' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Vendor not available</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, lineHeight: 19 }}>
            This vendor is currently inactive and cannot accept bookings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FB', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header / Banner */}
        <View style={{ height: 180, backgroundColor: meta.color, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {vendorDetails.banner_url && (
             <Image source={{ uri: vendorDetails.banner_url }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
          )}
          {/* Overlay gradient to ensure back button visibility */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: 16, left: 16, width: 38, height: 38, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 19, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Vendor Info Card */}
        <View style={{ marginHorizontal: 16, marginTop: -40, backgroundColor: '#fff', borderRadius: 16, padding: 18, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, borderWidth: 1, borderColor: '#F1F3F5', zIndex: 5 }}>
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            {/* Logo */}
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#F3F4F6', borderWidth: 3, borderColor: '#fff', marginTop: -35, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', elevation: 2 }}>
                {vendorDetails.logo_url ? (
                    <Image source={{ uri: vendorDetails.logo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                    <MaterialIcons name={meta.icon as any} size={32} color={meta.color} />
                )}
            </View>
            <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={13} color="#16A34A" />
              <Text style={{ color: '#15803D', fontWeight: '800', fontSize: 13, marginLeft: 4 }}>
                {Number(vendorDetails.rating || 4.8).toFixed(1)}
              </Text>
              <Text style={{ color: '#86EFAC', fontSize: 12, marginLeft: 2 }}>({vendorDetails.reviews})</Text>
            </View>
          </View>

          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>{vendorDetails.vendorName}</Text>
          <Text style={{ fontSize: 13, color: meta.color, fontWeight: '600', marginTop: 2 }}>
            {primaryServiceName} Expert
          </Text>

          {vendorDetails.description ? (
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 10, lineHeight: 18 }}>
                {vendorDetails.description}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 }}>
            {['Verified Pro', `${services.length} Services`, 'On-Time'].map((tag, index) => (
              <View key={`${tag}-${index}`} style={{ backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#374151' }}>✓ {tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instagram-style Tabs */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginTop: 24 }}>
          <TouchableOpacity
            style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: activeTab === 'services' ? '#111827' : 'transparent' }}
            onPress={() => setActiveTab('services')}
          >
            <Ionicons name="list" size={24} color={activeTab === 'services' ? '#111827' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: activeTab === 'reels' ? '#111827' : 'transparent' }}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons name="play-circle-outline" size={26} color={activeTab === 'reels' ? '#111827' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={{ minHeight: 400, paddingBottom: 40, backgroundColor: '#fff' }}>
          {activeTab === 'services' && (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {loading ? (
                <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#007BFF" />
                  <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading services...</Text>
                </View>
              ) : services.length === 0 ? (
                 <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                   <MaterialIcons name="design-services" size={48} color="#D1D5DB" />
                   <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 15, fontWeight: '500' }}>No services available yet.</Text>
                 </View>
              ) : (
                services.map((service, index) => (
                  <View
                    key={`${service.id}-${index}`}
                    style={{ backgroundColor: '#fff', borderRadius: 14, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: 1, borderColor: '#F1F3F5' }}
                  >
                    {/* Service Gallery Button */}
                    {service.image_urls && service.image_urls.length > 0 && (
                        <View style={{ position: 'relative', width: '100%', height: 160 }}>
                            <Image source={{ uri: service.image_urls[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                            <View style={{ position: 'absolute', bottom: 12, right: 12 }}>
                                <TouchableOpacity
                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                                    onPress={() => openServiceGallery(service.image_urls)}
                                >
                                    <Ionicons name="images-outline" size={16} color="#fff" />
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 6 }}>View Gallery ({service.image_urls.length})</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={{ padding: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                          {!service.image_urls?.length && (
                            <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: getServiceMeta(`${service.name} ${service.category}`).color + '15', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                              <MaterialIcons name={getServiceMeta(`${service.name} ${service.category}`).icon as any} size={22} color={getServiceMeta(`${service.name} ${service.category}`).color} />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15.5, fontWeight: '700', color: '#111827' }}>{service.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 6 }}>
                              <Ionicons name="pricetag-outline" size={12} color="#9CA3AF" />
                              <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>{service.category}</Text>
                            </View>
                            <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>{service.description}</Text>
                          </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>
                          {service.price ? `₹${service.price}` : 'On Request'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleBookNow(service)}
                          style={{ backgroundColor: '#007BFF', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13.5 }}>Book Service</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}



          {activeTab === 'reels' && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {vendorDetails.reels && vendorDetails.reels.length > 0 ? (
                vendorDetails.reels.map((reel: any, index: number) => (
                  <View key={reel.id || index} style={{ width: width / 3, height: (width / 3) * 1.77, padding: 1, position: 'relative' }}>
                    <Image source={{ uri: reel.thumbnail_url || 'https://via.placeholder.com/150' }} style={{ width: '100%', height: '100%', backgroundColor: '#000' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 6, right: 6 }}>
                      <Ionicons name="play-outline" size={20} color="#fff" />
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ width: '100%', alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="videocam-outline" size={48} color="#D1D5DB" />
                  <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 15, fontWeight: '500' }}>No reels available.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={galleryImages.length > 0}
        transparent
        animationType="fade"
        onRequestClose={closeServiceGallery}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(17,24,39,0.96)' }}>
          <View style={{ height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
              Service Gallery
            </Text>
            <TouchableOpacity
              onPress={closeServiceGallery}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {galleryImages.map((imageUrl, index) => (
              <View key={`${imageUrl}-${index}`} style={{ width, paddingHorizontal: 16 }}>
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: Math.min(width * 1.05, 520), borderRadius: 14, backgroundColor: '#111827' }}
                  resizeMode="contain"
                />
                <Text style={{ color: '#D1D5DB', textAlign: 'center', fontSize: 13, fontWeight: '700', marginTop: 14 }}>
                  {index + 1} / {galleryImages.length}
                </Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default VendorProfileScreen;
