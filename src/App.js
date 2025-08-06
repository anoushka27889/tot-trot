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

  // Saved page
  if (currentPage === 'saved') {
    const savedLocations = locations.filter(location => favorites.includes(location.id));
    
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ flex: 1 }}></div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: '#6366f1', fontSize: '3rem', marginBottom: '10px' }}>🌟 Tot Trot</h1>
              <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>Your Saved Activities</p>
              <p style={{ color: '#6b7280' }}>{favorites.length} locations saved for later</p>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <button
                onClick={() => setCurrentPage('home')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        </header>

        {savedLocations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💔</div>
            <h2 style={{ color: '#6b7280', fontSize: '1.5rem', marginBottom: '15px' }}>No saved activities yet!</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '1.1rem' }}>
              Start exploring and save activities you want to try with your little one.
            </p>
            <button
              onClick={() => setCurrentPage('home')}
              style={{
                padding: '15px 30px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🌟 Discover Activities
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            {savedLocations.map((location, index) => (
              <div key={location.id} style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '24px',
                backgroundColor: '#fff',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '2px solid #ef4444' // Red border to show it's saved
              }}>
                {/* Header */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h3 style={{ color: '#1f2937', margin: 0, fontSize: '1.5rem' }}>
                      {location.name}
                    </h3>
                    <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>
                      ❤️ SAVED
                    </span>
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
                        backgroundColor: '#ef4444',
                        color: 'white'
                      }}
                      title="Remove from Saved"
                    >
                      💔 Remove
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
            ))}
          </div>
        )}

        <footer style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
          <p>Built by a parent, for parents ❤️</p>
          <p style={{ fontSize: '12px' }}>Plan your next adventure!</p>
        </footer>
      </div>
    );
  }

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
        {/* Main content section */}
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <h2 style={{ color: '#1f2937', fontSize: '2rem', marginBottom: '20px' }}>About Tot Trot</h2>
          
          <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
            <h3 style={{ color: '#92400e', fontSize: '1.3rem', marginBottom: '15px' }}>👋 My Story</h3>
            <p style={{ color: '#92400e', marginBottom: '15px' }}>
              I moved to America in 2022 and have an almost 2-year-old, and the Bay Area has been incredible. But I realized I wanted to discover this amazing place WITH my kid, using local parent wisdom instead of the same tourist recommendations everyone gets.
            </p>
            <p style={{ color: '#92400e', marginBottom: '15px' }}>
              I was tired of always being the one following along when making plans with other parent friends. I wanted to explore beyond the handful of spots I already knew and be the one suggesting that perfect hidden gem for once.
            </p>
            <p style={{ color: '#92400e' }}>
              Last week, I posted a simple question on Reddit asking Bay Area parents for their favorite kid-friendly spots. The response was overwhelming - 150+ comments and 450+ shares! That validation made me realize other parents need this resource too.
            </p>
          </div>

          <h3 style={{ color: '#6366f1', fontSize: '1.3rem', marginBottom: '15px' }}>🚀 How This All Came Together</h3>
          <p style={{ color: '#4b5563', marginBottom: '20px' }}>
            I spent this past week collecting every recommendation from that Reddit thread and others, keeping all the parent quotes and insider tips as authentic as possible. No editing or sugar-coating - just real wisdom from parents who've actually been there with their kids.
          </p>

          <div style={{ backgroundColor: '#dbeafe', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
            <h4 style={{ color: '#1e40af', marginBottom: '10px' }}>🎯 My Vision</h4>
            <p style={{ color: '#1e40af', marginBottom: '10px' }}>
              I want to build a community where parents discover, share, and plan adventures - big or small - with their kids. Whether you're having an SOS "we need to get out of the house NOW" moment or planning ahead with other parent friends, I want this to be in your corner.
            </p>
          </div>

          <h3 style={{ color: '#6366f1', fontSize: '1.3rem', marginBottom: '15px' }}>✨ What We Have Right Now</h3>
          <div style={{ color: '#4b5563', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
              <div>• 87 locations recommended by actual parents</div>
              <div>• Distance sorting from your location</div>
              <div>• Age-appropriate filters</div>
              <div>• Authentic parent quotes and tips</div>
              <div>• Bookmark locations for later</div>
              <div>• Get directions via Google Maps</div>
              <div>• Share activities with other parents</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ecfdf5', padding: '20px', borderRadius: '8px' }}>
            <h4 style={{ color: '#065f46', marginBottom: '10px' }}>🤝 This Is Just the Beginning</h4>
            <p style={{ color: '#065f46', marginBottom: '10px' }}>
              This isn't visually designed yet - I'm focused on testing whether this is actually valuable for parents like us. Your feedback will determine what this becomes and what features matter most.
            </p>
            <p style={{ color: '#065f46' }}>
              I'm looking for honest thoughts on what's missing, what could be removed, and everything in between. Is this how you think about planning activities with your kids?
            </p>
          </div>
        </div>
        
        {/* Feedback section - NOW OUTSIDE the main content div */}
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', marginBottom: '15px', fontSize: '1.1rem' }}>I'd love your feedback on what's working and what's not!</p>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '0.9rem' }}>Found a hidden gem I missed? Have ideas for features? Just want to share your thoughts?</p>
          <a 
            href="mailto:feedback@tottrot.com" 
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
            💌 Send Feedback
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
      <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>
        {currentPage === 'saved' ? 'Your Saved Activities' : 
         currentPage === 'about' ? 'About Our Mission' : 
         'Parent-Approved Activities in the Bay Area'}
      </p>
      {currentPage === 'home' && (
        <>
          <p style={{ color: '#6b7280' }}>{filteredLocations.length} amazing places found</p>
          {userLocation && <p style={{ color: '#10b981', fontSize: '14px' }}>📍 Sorted by distance from your location</p>}
        </>
      )}
      {currentPage === 'saved' && (
        <p style={{ color: '#6b7280' }}>{favorites.length} locations saved for later</p>
      )}
    </div>
    <div style={{ flex: 1, textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
      {currentPage !== 'home' && (
        <button
          onClick={() => setCurrentPage('home')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ← Back
        </button>
      )}
      {currentPage === 'home' && (
        <>
          <button
            onClick={() => setCurrentPage('saved')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ❤️ Saved ({favorites.length})
          </button>
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
        </>
      )}
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