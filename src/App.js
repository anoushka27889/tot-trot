import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Bookmark, Share2, Navigation, MapPin, Clock, Users, ExternalLink } from 'lucide-react';
import locationsData from './data/locations.json';

function App() {
  const [locations] = useState(locationsData.locations);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [filters, setFilters] = useState({
    duration: 'All Durations',
    ageRange: 'All Ages', 
    interest: [],
    location: 'All Regions'
  });

  const [favorites, setFavorites] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Auto-request geolocation on page load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermissionDenied(false);
        },
        (error) => {
          console.log('Location access denied');
          setLocationPermissionDenied(true);
          setUserLocation(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      );
    }
  }, []);

  // Load and save favorites
  useEffect(() => {
    const savedFavorites = localStorage.getItem('tot_trot_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tot_trot_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Add Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Fredoka+One:wght@400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'interest') {
      setFilters(prev => {
        const currentInterests = prev.interest;
        let newInterests;
        
        if (value === 'All Interests') {
          newInterests = [];
        } else if (currentInterests.includes(value)) {
          newInterests = currentInterests.filter(interest => interest !== value);
        } else {
          newInterests = [...currentInterests, value];
        }
        
        return {
          ...prev,
          [filterType]: newInterests
        };
      });
    } else {
      setFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    }
  };

  // Action functions
  const toggleFavorite = (locationId) => {
    setFavorites(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const getDirections = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  const shareActivity = (location) => {
    if (navigator.share) {
      navigator.share({
        title: location.name,
        text: `Check out ${location.name} in ${location.city}! ${location.description}`,
        url: window.location.href
      });
    } else {
      const shareText = `${location.name} - ${location.city}\n${location.description}\n${location.address}\n\nFound on Tot Trot: ${window.location.href}`;
      navigator.clipboard.writeText(shareText);
      alert('Activity info copied to clipboard!');
    }
  };

  // Get available filter options (disable dead ends)
  const getAvailableOptions = (filterType, currentFilters) => {
    let testFilters = { ...currentFilters };
    const availableOptions = [];

    if (filterType === 'duration') {
      Object.keys(locationsData.filterOptions.duration).forEach(option => {
        testFilters.duration = option;
        if (getFilteredCount(testFilters) > 0) {
          availableOptions.push(option);
        }
      });
    } else if (filterType === 'ageRange') {
      Object.keys(locationsData.filterOptions.ageRanges).forEach(option => {
        testFilters.ageRange = option;
        if (getFilteredCount(testFilters) > 0) {
          availableOptions.push(option);
        }
      });
    } else if (filterType === 'location') {
      Object.keys(locationsData.filterOptions.regions).forEach(option => {
        testFilters.location = option;
        if (getFilteredCount(testFilters) > 0) {
          availableOptions.push(option);
        }
      });
    } else if (filterType === 'interest') {
      Object.keys(locationsData.filterOptions.interests).forEach(option => {
        testFilters.interest = [...currentFilters.interest];
        if (!testFilters.interest.includes(option)) {
          testFilters.interest.push(option);
          if (getFilteredCount(testFilters) > 0) {
            availableOptions.push(option);
          }
        } else {
          availableOptions.push(option); // Already selected
        }
      });
    }

    return availableOptions;
  };

  const getFilteredCount = (testFilters) => {
    let filtered = locations;

    if (testFilters.duration !== 'All Durations') {
      filtered = filtered.filter(location => location.duration === testFilters.duration);
    }

    if (testFilters.ageRange !== 'All Ages') {
      filtered = filtered.filter(location => 
        location.ageRanges && location.ageRanges.includes(testFilters.ageRange)
      );
    }

    if (testFilters.interest.length > 0) {
      filtered = filtered.filter(location =>
        location.interests && testFilters.interest.some(selectedInterest => 
          location.interests.includes(selectedInterest)
        )
      );
    }

    if (testFilters.location !== 'All Regions') {
      filtered = filtered.filter(location => location.region === testFilters.location);
    }

    return filtered.length;
  };

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let filtered = locations;

    if (filters.duration !== 'All Durations') {
      filtered = filtered.filter(location => location.duration === filters.duration);
    }

    if (filters.ageRange !== 'All Ages') {
      filtered = filtered.filter(location => 
        location.ageRanges && location.ageRanges.includes(filters.ageRange)
      );
    }

    if (filters.interest.length > 0) {
      filtered = filtered.filter(location =>
        location.interests && filters.interest.some(selectedInterest => 
          location.interests.includes(selectedInterest)
        )
      );
    }

    if (filters.location !== 'All Regions') {
      filtered = filtered.filter(location => location.region === filters.location);
    }

    // Sort by distance if user location available and permission granted
    if (userLocation && !locationPermissionDenied) {
      filtered.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coordinates[0], a.coordinates[1]);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coordinates[0], b.coordinates[1]);
        return distA - distB;
      });
    }

    return filtered;
  }, [locations, filters, userLocation, locationPermissionDenied]);

  const getDistanceText = (location) => {
    if (!userLocation || !location.coordinates || locationPermissionDenied) return '';
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      location.coordinates[0], location.coordinates[1]
    );
    return `${distance.toFixed(1)} mi away`;
  };

  const clearAllFilters = () => {
    setFilters({
      duration: 'All Durations',
      ageRange: 'All Ages',
      interest: [],
      location: 'All Regions'
    });
    setShowResults(false);
  };

  // iOS Settings-style Interest Selector Component
  const InterestSelector = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const availableInterests = getAvailableOptions('interest', filters);
    
    const getDisplayText = () => {
      if (filters.interest.length === 0) {
        return 'activities';
      } else if (filters.interest.length === 1) {
        return locationsData.filterOptions.interests[filters.interest[0]].toLowerCase();
      } else if (filters.interest.length === 2) {
        return `${locationsData.filterOptions.interests[filters.interest[0]]} & ${locationsData.filterOptions.interests[filters.interest[1]]}`.toLowerCase();
      } else {
        return `${filters.interest.length} activities`;
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showDropdown && !event.target.closest('.interest-selector')) {
          setShowDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    return (
      <div className="interest-selector" style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: '6px', 
            border: '2px solid #059669', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#059669', 
            backgroundColor: '#f0fdf4', 
            fontFamily: '"Space Grotesk", sans-serif',
            cursor: 'pointer',
            minWidth: '120px',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {getDisplayText()}
          <span style={{ marginLeft: '8px', fontSize: '12px' }}>▼</span>
        </button>
        
        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            zIndex: 1000,
            maxHeight: '280px',
            overflowY: 'auto',
            marginTop: '4px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
          }}>
            {/* Clear all option */}
            <div
              onClick={() => handleFilterChange('interest', 'All Interests')}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: filters.interest.length === 0 ? '#f0fdf4' : 'white',
                borderBottom: '1px solid #f3f4f6',
                fontWeight: filters.interest.length === 0 ? '600' : '400',
                fontSize: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#374151'
              }}
            >
              All activities
              {filters.interest.length === 0 && <span style={{ color: '#059669', fontSize: '16px' }}>✓</span>}
            </div>
            
            {/* Individual interest options */}
            {Object.entries(locationsData.filterOptions.interests).map(([key, label]) => (
              <div
                key={key}
                onClick={() => availableInterests.includes(key) && handleFilterChange('interest', key)}
                style={{
                  padding: '12px 16px',
                  cursor: availableInterests.includes(key) ? 'pointer' : 'not-allowed',
                  opacity: availableInterests.includes(key) ? 1 : 0.4,
                  backgroundColor: filters.interest.includes(key) ? '#f0fdf4' : 'white',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: filters.interest.includes(key) ? '600' : '400',
                  fontSize: '15px',
                  color: '#374151'
                }}
              >
                {label}
                {filters.interest.includes(key) && (
                  <span style={{ color: '#059669', fontSize: '16px' }}>✓</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function for results summary
  const getSelectedInterestsText = () => {
    if (filters.interest.length === 0) return '';
    if (filters.interest.length === 1) {
      return `for ${locationsData.filterOptions.interests[filters.interest[0]].toLowerCase()}`;
    }
    if (filters.interest.length === 2) {
      return `for ${locationsData.filterOptions.interests[filters.interest[0]].toLowerCase()} & ${locationsData.filterOptions.interests[filters.interest[1]].toLowerCase()}`;
    }
    return `for ${filters.interest.length} activities`;
  };

  // Detail Page Component
  const DetailPage = ({ location }) => {
    const nearbyLocations = location.nearbyActivities?.map(id => 
      locations.find(loc => loc.id.toString() === id.replace(/[^0-9]/g, ''))
    ).filter(Boolean) || [];

    return (
      <div style={{ padding: '20px', fontFamily: '"Space Grotesk", sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          maxWidth: '1000px',
          margin: '0 auto 20px auto'
        }}>
          <button
            onClick={() => setSelectedLocation(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#374151',
              fontWeight: '600'
            }}
          >
            <ChevronLeft size={20} />
            {location.name}
          </button>
          
          <button
            onClick={() => toggleFavorite(location.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: favorites.includes(location.id) ? '#ef4444' : '#6b7280'
            }}
          >
            <Bookmark size={24} fill={favorites.includes(location.id) ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Hero Image Placeholder */}
          <div style={{
            height: '200px',
            backgroundColor: '#e5e7eb',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280'
          }}>
            [Hero Image]
          </div>

          {/* Description */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '20px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px 0', color: '#374151' }}>
              {location.longDescription}
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: '#6b7280' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={16} />
                {locationsData.filterOptions.duration[location.duration]}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                💰 {location.cost}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={16} />
                Ages {location.ageRanges?.join(', ')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                🌤️ {location.interests?.includes('indoor') ? 'Indoor' : 'Outdoor'}
              </span>
            </div>
          </div>

          {/* Parent Quotes */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '20px' }}>
            <h3 style={{ color: '#374151', fontSize: '18px', marginBottom: '16px', fontWeight: '600' }}>
              💬 Parents said
            </h3>
            
            {location.parentQuotes?.map((quote, index) => (
              <div key={index} style={{
                backgroundColor: '#f3f0ff',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '12px',
                position: 'relative',
                border: '1px solid #e9d5ff'
              }}>
                <p style={{ margin: 0, fontStyle: 'italic', color: '#581c87' }}>
                  "{quote}"
                </p>
              </div>
            ))}
          </div>

          {/* Rest of detail page sections... */}
          {/* [Previous detail page code continues...] */}
        </div>
      </div>
    );
  };

  // Show detail page if location selected
  if (selectedLocation) {
    return <DetailPage location={selectedLocation} />;
  }

  // [Previous saved and about page code continues...] 

  // Main app (home page)
  return (
    <div style={{ padding: '20px', fontFamily: '"Space Grotesk", sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ 
              fontFamily: '"Fredoka One", cursive',
              color: '#6366f1', 
              fontSize: '3rem', 
              marginBottom: '8px', 
              margin: '0',
              fontWeight: '400'
            }}>
              Tot Trot
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0', marginBottom: '15px', fontWeight: '400' }}>
              Built by parents, tested by kids
            </p>
          </div>
          
          {/* Action buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '12px', 
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setCurrentPage('saved')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Bookmark size={16} />
              Saved ({favorites.length})
            </button>
            <button
              onClick={() => setCurrentPage('about')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ℹ️ About
            </button>
          </div>
        </div>
      </header>

      {/* Mad Lib Style Filters */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', marginBottom: '30px', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '1.2rem', color: '#374151', lineHeight: '1.8', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span>Looking for</span>
            <InterestSelector />
            <span>with a</span>
            <select 
              value={filters.ageRange} 
              onChange={(e) => handleFilterChange('ageRange', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #7c3aed', fontSize: '16px', fontWeight: '600', color: '#7c3aed', backgroundColor: '#f3f0ff', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              <option value="All Ages">kid</option>
              {Object.entries(locationsData.filterOptions.ageRanges)
                .filter(([key]) => getAvailableOptions('ageRange', filters).includes(key))
                .map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            
            <span>- got</span>
            <select 
              value={filters.duration} 
              onChange={(e) => handleFilterChange('duration', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #6366f1', fontSize: '16px', fontWeight: '600', color: '#6366f1', backgroundColor: '#f0f4ff', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              <option value="All Durations">any time</option>
              {Object.entries(locationsData.filterOptions.duration)
                .filter(([key]) => getAvailableOptions('duration', filters).includes(key))
                .map(([key, label]) => (
                <option key={key} value={key}>{label.toLowerCase()}</option>
              ))}
            </select>
            
            <span>around</span>
            <select 
              value={filters.location} 
              onChange={(e) => handleFilterChange('location', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #dc2626', fontSize: '16px', fontWeight: '600', color: '#dc2626', backgroundColor: '#fef2f2', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              <option value="All Regions">anywhere</option>
              {Object.keys(locationsData.filterOptions.regions)
                .filter(region => region !== 'All Regions')
                .filter(region => getAvailableOptions('location', filters).includes(region))
                .map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          
          {/* Let's go button */}
          <button
            onClick={() => setShowResults(true)}
            style={{
              padding: '16px 32px',
              backgroundColor: '#000000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: '"Space Grotesk", sans-serif'
            }}
          >
            Let's go!
          </button>
        </div>
      </div>

      {/* Results - only show if showResults is true */}
      {showResults && (
        <>
          {/* Results Summary */}
          <div style={{ 
            maxWidth: '1000px', 
            margin: '0 auto', 
            marginBottom: '30px', 
            textAlign: 'center',
            padding: '15px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ color: '#374151', margin: '0', fontSize: '1.1rem', fontWeight: '600' }}>
              🎯 {filteredLocations.length} amazing places found {getSelectedInterestsText()}
            </p>
            {userLocation && !locationPermissionDenied && (
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>
                <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Sorted by distance from your location
              </p>
            )}
          </div>

          {/* Results with Activity Cards */}
          <div style={{ display: 'grid', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            {filteredLocations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '1.5rem', color: '#6b7280' }}>No locations found with current filters</p>
                <button 
                  onClick={clearAllFilters}
                  style={{ 
                    marginTop: '20px',
                    padding: '12px 24px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Show All Activities
                </button>
              </div>
            ) : (
              filteredLocations.map((location) => (
                <div key={location.id} style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px', 
                  padding: '24px',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}>
                  {/* Bookmark in top right */}
                  <button
                    onClick={() => toggleFavorite(location.id)}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: favorites.includes(location.id) ? '#ef4444' : '#9ca3af'
                    }}
                  >
                    <Bookmark size={24} fill={favorites.includes(location.id) ? 'currentColor' : 'none'} />
                  </button>

                  {/* Content */}
                  <div style={{ marginRight: '40px' }}>
                    <h3 style={{ color: '#1f2937', margin: 0, fontSize: '1.5rem', marginBottom: '8px', fontWeight: '600' }}>
                      {location.name}
                    </h3>
                    
                    <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '14px' }}>
                      {location.description}
                    </p>

                    {/* See details link */}
                    <button
                      onClick={() => setSelectedLocation(location)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6366f1',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        marginBottom: '16px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      See details <ExternalLink size={14} />
                    </button>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                      <span>{location.city}, {location.region}</span>
                      <span>💰 {location.cost}</span>
                      <span>⏰ {locationsData.filterOptions.duration[location.duration]}</span>
                      {!locationPermissionDenied && userLocation && (
                        <span style={{ fontWeight: '500' }}>
                          <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {getDistanceText(location)}
                        </span>
                      )}
                    </div>
                    
                    {/* Parent Quote */}
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ color: '#1f2937', fontSize: '1rem', marginBottom: '8px', fontWeight: '600' }}>
                        💬 Parents said
                      </h4>
                      <div style={{
                        backgroundColor: '#f3f0ff',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e9d5ff'
                      }}>
                        <p style={{ margin: 0, fontStyle: 'italic', color: '#581c87', fontSize: '14px' }}>
                          "{location.parentQuotes?.[0]}"
                        </p>
                      </div>
                    </div>

                    {/* Pro Tip */}
                    {location.insiderTip && (
                      <div style={{ 
                        backgroundColor: '#eff6ff', 
                        padding: '12px', 
                        borderRadius: '8px',
                        marginBottom: '16px'
                      }}>
                        <strong style={{ color: '#1e40af', fontSize: '0.9rem', fontWeight: '600' }}>💡 Pro Tip:</strong>
                        <p style={{ color: '#1e40af', margin: '4px 0 0 0', fontSize: '0.9rem' }}>{location.insiderTip}</p>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div style={{ 
                      paddingTop: '16px',
                      borderTop: '1px solid #e5e7eb',
                      display: 'flex', 
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => shareActivity(location)}
                        style={{
                          flex: '1',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Share2 size={16} />
                      </button>
                      
                      <button
                        onClick={() => getDirections(location.address)}
                        style={{
                          flex: '2',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          backgroundColor: '#10b981',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Navigation size={16} />
                        Get Directions
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
        <p>Built by a parent, for parents ❤️</p>
        <p style={{ fontSize: '12px' }}>87 parent-approved locations and counting</p>
      </footer>
    </div>
  );
}

export default App;
