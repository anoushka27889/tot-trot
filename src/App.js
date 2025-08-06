import React, { useState, useEffect, useMemo } from 'react';
import locationsData from './data/locations.json';

function App() {
  const [locations] = useState(locationsData.locations);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    region: 'All Regions',
    city: 'All Cities',
    ageRange: 'All Ages',
    interest: 'All Interests',
    duration: 'All Durations'
  });

  // New state for additional features
  const [favorites, setFavorites] = useState([]);
  const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'about'

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

  // Get available cities based on selected region
  const availableCities = useMemo(() => {
    if (filters.region === 'All Regions') {
      return ['All Cities'];
    }
    const regionCities = locationsData.filterOptions.regions[filters.region] || [];
    return ['All Cities', ...regionCities];
  }, [filters.region]);

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let filtered = locations;

    // Region filter
    if (filters.region !== 'All Regions') {
      filtered = filtered.filter(location => location.region === filters.region);
    }

    // City filter
    if (filters.city !== 'All Cities') {
      filtered = filtered.filter(location => location.city === filters.city);
    }

    // Age filter
    if (filters.ageRange !== 'All Ages') {
      filtered = filtered.filter(location => 
        location.ageRanges && location.ageRanges.includes(filters.ageRange)
      );
    }

    // Interest filter
    if (filters.interest !== 'All Interests') {
      filtered = filtered.filter(location =>
        location.interests && location.interests.includes(filters.interest)
      );
    }

    // Duration filter
    if (filters.duration !== 'All Durations') {
      filtered = filtered.filter(location => location.duration === filters.duration);
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

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterType]: value };
      // Reset city filter when region changes
      if (filterType === 'region') {
        newFilters.city = 'All Cities';
      }
      return newFilters;
    });
  };

  const getDistanceText = (location) => {
    if (!userLocation || !location.coordinates) return '';
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      location.coordinates[0], location.coordinates[1]
    );
    return `📍 ${distance.toFixed(1)} miles away`;
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
      .slice(0, 2) // Show max 2 to avoid clutter
      .join(', ');
  };

  // About page
  if (currentPage === 'about') {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ flex: 1 }}></div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: '#6366f1', fontSize: '3rem', marginBottom: '10px' }}>🌟 Tot Trot</h1>
              <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>About Our Mission</p>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <button
                onClick={() => setCurrentPage('home')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ← Back to Activities
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h2 style={{ color: '#1f2937', fontSize: '2rem', marginBottom: '20px' }}>About Tot Trot</h2>
            
            <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
              <h3 style={{ color: '#92400e', fontSize: '1.3rem', marginBottom: '15px' }}>👋 My Story</h3>
              <p style={{ color: '#92400e', marginBottom: '15px' }}>
                Hi! I'm a parent who moved to the Bay Area from out of state, and I quickly realized something: weekends with kids here can be overwhelming when you don't know the area.
              </p>
              <p style={{ color: '#92400e', marginBottom: '15px' }}>
                I'd spend Friday nights frantically googling "things to do with kids Bay Area" and getting the same generic results - Pier 39, Golden Gate Park, the usual tourist spots. But what about the hidden gems? The places where local parents actually take their kids?
              </p>
              <p style={{ color: '#92400e' }}>
                After too many disappointing weekend adventures and overpaying for crowded attractions, I decided to do something about it. I dove deep into parent communities online to find the REAL recommendations.
              </p>
            </div>
            
            <h3 style={{ color: '#6366f1', fontSize: '1.3rem', marginBottom: '15px' }}>🔍 How I Built This</h3>
            <p style={{ color: '#4b5563', marginBottom: '20px' }}>
              I spent months combing through Reddit threads, Facebook parent groups, and local community boards to find activities that parents actually recommend - not just the obvious spots, but the authentic, local favorites that make weekends special.
            </p>
            
            <div style={{ backgroundColor: '#dbeafe', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
              <h4 style={{ color: '#1e40af', marginBottom: '10px' }}>📊 My Research Process:</h4>
              <ul style={{ color: '#1e40af', marginLeft: '20px' }}>
                <li>Analyzed 100+ Reddit posts from r/BayAreaParents and local subreddits</li>
                <li>Collected every authentic parent quote and insider tip I could find</li>
                <li>Verified locations, hours, and practical details</li>
                <li>Organized everything by age-appropriate developmental benefits</li>
                <li>Added distance sorting because nobody wants to drive across the whole Bay Area</li>
              </ul>
            </div>
            
            <h3 style={{ color: '#6366f1', fontSize: '1.3rem', marginBottom: '15px' }}>💡 What Makes This Different</h3>
            <p style={{ color: '#4b5563', marginBottom: '20px' }}>
              Every location includes authentic parent quotes and practical insider tips - because there's a huge difference between what sounds good online and what actually works when you're there with real kids on a Saturday morning.
            </p>
            
            <div style={{ backgroundColor: '#ecfdf5', padding: '20px', borderRadius: '8px' }}>
              <h4 style={{ color: '#065f46', marginBottom: '10px' }}>📍 87 Parent-Approved Locations</h4>
              <p style={{ color: '#065f46' }}>
                From free neighborhood parks to unique adventures, every single spot has been recommended by actual Bay Area parents who've been there with their kids. No tourist traps, no sponsored content - just real recommendations from parents like us.
              </p>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '1.1rem' }}>Found a hidden gem I missed? I'd love to add it!</p>
            <a 
              href="mailto:hello@tottrot.com" 
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#6366f1',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              💌 Suggest a Location
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ flex: 1 }}></div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: '#6366f1', fontSize: '3rem', marginBottom: '10px' }}>🌟 Tot Trot</h1>
            <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>Parent-Approved Activities in the Bay Area</p>
            <p style={{ color: '#6b7280' }}>{filteredLocations.length} amazing places found</p>
            {userLocation && <p style={{ color: '#10b981', fontSize: '14px' }}>📍 Sorted by distance from your location</p>}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <button
              onClick={() => setCurrentPage('about')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ℹ️ About
            </button>
          </div>
        </div>
      </header>

      {/* Enhanced Filters */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', marginBottom: '30px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          
          {/* Region Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              🌍 Region
            </label>
            <select 
              value={filters.region} 
              onChange={(e) => handleFilterChange('region', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #d1d5db', fontSize: '16px' }}
            >
              {Object.keys(locationsData.filterOptions.regions).map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              🏙️ City
            </label>
            <select 
              value={filters.city} 
              onChange={(e) => handleFilterChange('city', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #d1d5db', fontSize: '16px' }}
            >
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Age Range Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              👶 Age Range
            </label>
            <select 
              value={filters.ageRange} 
              onChange={(e) => handleFilterChange('ageRange', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #d1d5db', fontSize: '16px' }}
            >
              <option value="All Ages">All Ages</option>
              {Object.entries(locationsData.filterOptions.ageRanges).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Interest Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              🎯 Interests
            </label>
            <select 
              value={filters.interest} 
              onChange={(e) => handleFilterChange('interest', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #d1d5db', fontSize: '16px' }}
            >
              <option value="All Interests">All Interests</option>
              {Object.entries(locationsData.filterOptions.interests).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Duration Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              ⏰ Time Available
            </label>
            <select 
              value={filters.duration} 
              onChange={(e) => handleFilterChange('duration', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #d1d5db', fontSize: '16px' }}
            >
              <option value="All Durations">All Durations</option>
              {Object.entries(locationsData.filterOptions.duration).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ display: 'grid', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        {filteredLocations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '1.5rem', color: '#6b7280' }}>No locations found with current filters</p>
            <button 
              onClick={() => setFilters({
                region: 'All Regions',
                city: 'All Cities', 
                ageRange: 'All Ages',
                interest: 'All Interests',
                duration: 'All Durations'
              })}
              style={{ 
                marginTop: '20px',
                padding: '12px 24px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredLocations.map((location, index) => (
            <div key={location.id} style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px', 
              padding: '24px',
              backgroundColor: '#fff',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              {/* Header */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h3 style={{ color: '#1f2937', margin: 0, fontSize: '1.5rem' }}>
                    {location.name}
                  </h3>
                  {userLocation && (
                    <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>
                      #{index + 1} {getDistanceText(location)}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  <span>📍 {location.city}, {location.region}</span>
                  <span>💰 {location.cost}</span>
                  <span>⏰ {locationsData.filterOptions.duration[location.duration]}</span>
                </div>

                {location.ageRanges && (
                  <div style={{ fontSize: '14px', color: '#7c3aed', marginBottom: '4px' }}>
                    👶 <strong>Ages:</strong> {getAgeRangeDisplay(location.ageRanges)}
                  </div>
                )}

                {location.developmentMilestones && (
                  <div style={{ fontSize: '14px', color: '#059669', marginBottom: '8px' }}>
                    🧠 <strong>Development:</strong> {getDevelopmentDisplay(location.developmentMilestones)}
                  </div>
                )}
              </div>
              
              {/* Parent Review */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#1f2937', fontSize: '1.1rem', marginBottom: '8px' }}>
                  👨‍👩‍👧‍👦 Parent Review
                </h4>
                <blockquote style={{ 
                  fontStyle: 'italic', 
                  color: '#374151', 
                  borderLeft: '4px solid #6366f1',
                  paddingLeft: '16px',
                  margin: 0,
                  backgroundColor: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: '6px'
                }}>
                  "{location.parentQuote}"
                </blockquote>
              </div>
              
              {/* Pro Tip */}
              {location.insiderTips && (
                <div style={{ 
                  backgroundColor: '#eff6ff', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <strong style={{ color: '#1e40af', fontSize: '0.9rem' }}>💡 Pro Tip:</strong>
                  <p style={{ color: '#1e40af', margin: '4px 0 0 0', fontSize: '0.9rem' }}>{location.insiderTips}</p>
                </div>
              )}
              
              {/* Action Buttons & Address */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => toggleFavorite(location.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: favorites.includes(location.id) ? '#ef4444' : '#f3f4f6',
                      color: favorites.includes(location.id) ? 'white' : '#374151'
                    }}
                    title="Save for Later"
                  >
                    {favorites.includes(location.id) ? '❤️ Saved' : '🤍 Save'}
                  </button>
                  
                  <button
                    onClick={() => shareActivity(location)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: '#3b82f6',
                      color: 'white'
                    }}
                    title="Share Activity"
                  >
                    📤 Share
                  </button>
                  
                  <button
                    onClick={() => getDirections(location.address)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: '#10b981',
                      color: 'white'
                    }}
                    title="Get Directions"
                  >
                    🗺️ Directions
                  </button>
                </div>
                
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  📍 {location.address}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
        <p>Built by a parent, for parents ❤️</p>
        <p style={{ fontSize: '12px' }}>87 parent-approved locations and counting</p>
      </footer>
    </div>
  );
}

export default App;