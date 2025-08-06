import React, { useState, useEffect, useMemo } from 'react';
import locationsData from './data/locations.json';

function App() {
  const [locations] = useState(locationsData.locations);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    duration: 'All Durations',
    ageRange: 'All Ages',
    interest: [], // CHANGED: Now an array for multiple selections
    location: 'All Regions'
  });

  // New state for additional features
  const [favorites, setFavorites] = useState([]);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'about', or 'saved'

  // Get user location for distance sorting
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location access denied')
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

  // UPDATED: Handle filter changes including multi-select interests
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'interest') {
      // Handle multi-select for interests
      setFilters(prev => {
        const currentInterests = prev.interest;
        let newInterests;
        
        if (value === 'All Interests') {
          // If "All Interests" selected, clear all selections
          newInterests = [];
        } else if (currentInterests.includes(value)) {
          // If already selected, remove it
          newInterests = currentInterests.filter(interest => interest !== value);
        } else {
          // If not selected, add it
          newInterests = [...currentInterests, value];
        }
        
        return {
          ...prev,
          [filterType]: newInterests
        };
      });
    } else {
      // Handle other filters normally
      setFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    }
  };

  // New action functions
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
        text: `Check out ${location.name} in ${location.city}! "${location.parentQuote}"`,
        url: window.location.href
      });
    } else {
      const shareText = `${location.name} - ${location.city}\n"${location.parentQuote}"\n${location.address}\n\nFound on Tot Trot: ${window.location.href}`;
      navigator.clipboard.writeText(shareText);
      alert('Activity info copied to clipboard!');
    }
  };

  // UPDATED: Filter and sort locations with multi-interest support
  const filteredLocations = useMemo(() => {
    let filtered = locations;

    // Duration filter
    if (filters.duration !== 'All Durations') {
      filtered = filtered.filter(location => location.duration === filters.duration);
    }

    // Age filter
    if (filters.ageRange !== 'All Ages') {
      filtered = filtered.filter(location => 
        location.ageRanges && location.ageRanges.includes(filters.ageRange)
      );
    }

    // UPDATED: Interest filter for multiple selections
    if (filters.interest.length > 0) {
      filtered = filtered.filter(location =>
        location.interests && filters.interest.some(selectedInterest => 
          location.interests.includes(selectedInterest)
        )
      );
    }

    // Location filter
    if (filters.location !== 'All Regions') {
      filtered = filtered.filter(location => location.region === filters.location);
    }

    // Sort by distance if user location available
    if (userLocation) {
      filtered.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coordinates[0], a.coordinates[1]);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coordinates[0], b.coordinates[1]);
        return distA - distB;
      });
    }

    return filtered;
  }, [locations, filters, userLocation]);

  const getDistanceText = (location) => {
    if (!userLocation || !location.coordinates) return '';
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      location.coordinates[0], location.coordinates[1]
    );
    return `${distance.toFixed(1)} miles away`;
  };

  const getAgeRangeDisplay = (ageRanges) => {
    if (!ageRanges || ageRanges.length === 0) return '';
    return ageRanges
      .map(age => locationsData.filterOptions.ageRanges[age])
      .join(', ');
  };

  const getDevelopmentDisplay = (milestones) => {
    if (!milestones || milestones.length === 0) return '';
    return milestones
      .map(milestone => locationsData.filterOptions.developmentMilestones[milestone])
      .slice(0, 2)
      .join(', ');
  };

  // UPDATED: Clear all filters
  const clearAllFilters = () => {
    setFilters({
      duration: 'All Durations',
      ageRange: 'All Ages',
      interest: [], // CHANGED: Reset to empty array
      location: 'All Regions'
    });
  };

  // NEW: Multi-select Interest Selector Component
  const InterestSelector = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    
    const getDisplayText = () => {
      if (filters.interest.length === 0) {
        return 'everything';
      } else if (filters.interest.length === 1) {
        return locationsData.filterOptions.interests[filters.interest[0]].toLowerCase();
      } else if (filters.interest.length === 2) {
        return `${locationsData.filterOptions.interests[filters.interest[0]]} & ${locationsData.filterOptions.interests[filters.interest[1]]}`.toLowerCase();
      } else {
        return `${filters.interest.length} interests`;
      }
    };

    return (
      <div style={{ position: 'relative' }}>
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
          <span style={{ marginLeft: '8px' }}>▼</span>
        </button>
        
        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '2px solid #059669',
            borderRadius: '6px',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            marginTop: '2px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            {/* Clear all option */}
            <div
              onClick={() => {
                handleFilterChange('interest', 'All Interests');
                setShowDropdown(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: filters.interest.length === 0 ? '#f0fdf4' : 'white',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: filters.interest.length === 0 ? '600' : '400',
                fontSize: '14px'
              }}
            >
              ✨ Everything
            </div>
            
            {/* Individual interest options */}
            {Object.entries(locationsData.filterOptions.interests).map(([key, label]) => (
              <div
                key={key}
                onClick={() => handleFilterChange('interest', key)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: filters.interest.includes(key) ? '#f0fdf4' : 'white',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: filters.interest.includes(key) ? '600' : '400',
                  fontSize: '14px'
                }}
              >
                {label}
                {filters.interest.includes(key) && (
                  <span style={{ color: '#059669' }}>✓</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // NEW: Helper function for results summary
  const getSelectedInterestsText = () => {
    if (filters.interest.length === 0) return '';
    if (filters.interest.length === 1) {
      return `for ${locationsData.filterOptions.interests[filters.interest[0]].toLowerCase()}`;
    }
    if (filters.interest.length === 2) {
      return `for ${locationsData.filterOptions.interests[filters.interest[0]].toLowerCase()} & ${locationsData.filterOptions.interests[filters.interest[1]].toLowerCase()}`;
    }
    return `for ${filters.interest.length} interests`;
  };

  // [Previous page components for 'saved' and 'about' remain the same...]
  
  // Main app with UPDATED mad lib filters
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
              ❤️ Saved ({favorites.length})
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

      {/* UPDATED Mad Lib Style Filters */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', marginBottom: '30px', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h3 style={{ color: '#374151', fontSize: '1.1rem', margin: '0', marginBottom: '20px', fontWeight: '500' }}>Tell us what you're looking for:</h3>
          
          <div style={{ fontSize: '1.2rem', color: '#374151', lineHeight: '1.8', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span>Got</span>
            <select 
              value={filters.duration} 
              onChange={(e) => handleFilterChange('duration', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #6366f1', fontSize: '16px', fontWeight: '600', color: '#6366f1', backgroundColor: '#f0f4ff', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              <option value="All Durations">any amount of time</option>
              {Object.entries(locationsData.filterOptions.duration).map(([key, label]) => (
                <option key={key} value={key}>{label.toLowerCase()}</option>
              ))}
            </select>
            
            <span>and a</span>
            <select 
              value={filters.ageRange} 
              onChange={(e) => handleFilterChange('ageRange', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #7c3aed', fontSize: '16px', fontWeight: '600', color: '#7c3aed', backgroundColor: '#f3f0ff', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              <option value="All Ages">kid</option>
              {Object.entries(locationsData.filterOptions.ageRanges).map(([key, label]) => (
                <option key={key} value={key}>{label.toLowerCase()}</option>
              ))}
            </select>
            
            <span>who loves</span>
            {/* REPLACED: Select dropdown with new InterestSelector */}
            <InterestSelector />
            
            <span>near</span>
            <select 
              value={filters.location} 
              onChange={(e) => handleFilterChange('location', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #dc2626', fontSize: '16px', fontWeight: '600', color: '#dc2626', backgroundColor: '#fef2f2', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              <option value="All Regions">anywhere</option>
              {Object.keys(locationsData.filterOptions.regions).filter(region => region !== 'All Regions').map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            
            <span>?</span>
          </div>
          
          {/* Show me options button */}
          <button
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
            onClick={() => {
              // This could trigger a search or just highlight the results
            }}
          >
            Show me options!
          </button>
        </div>
      </div>

      {/* UPDATED Results Summary */}
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
        {userLocation && (
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>
            📍 Sorted by distance from your location
          </p>
        )}
      </div>

      {/* Rest of the component remains the same... */}
      {/* Results cards, footer, etc. */}
    </div>
  );
}

export default App;