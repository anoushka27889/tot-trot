import React, { useState, useEffect, useMemo } from 'react';
import locationsData from './data/locations.json';

function App() {
  const [locations] = useState(locationsData.locations);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    duration: 'All Durations',
    ageRange: 'All Ages',
    interest: 'All Interests',
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

  // Filter and sort locations
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

    // Interest filter
    if (filters.interest !== 'All Interests') {
      filtered = filtered.filter(location =>
        location.interests && location.interests.includes(filters.interest)
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

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

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

  // Saved page
  if (currentPage === 'saved') {
    const savedLocations = locations.filter(location => favorites.includes(location.id));
    
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ color: '#6366f1', fontSize: '3rem', marginBottom: '8px', margin: '0' }}>🌟 Tot Trot</h1>
              <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>Your Saved Activities</p>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>{favorites.length} locations saved for later</p>
            </div>
            <button
              onClick={() => setCurrentPage('home')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
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
                border: '2px solid #ef4444',
                borderRadius: '12px', 
                padding: '24px',
                backgroundColor: '#fff',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {/* Header with address at top */}
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ color: '#1f2937', margin: 0, fontSize: '1.5rem', marginBottom: '8px' }}>
                    {location.name}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    📍 {location.address}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    <span>🏙️ {location.city}, {location.region}</span>
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
                    marginBottom: '16px'
                  }}>
                    <strong style={{ color: '#1e40af', fontSize: '0.9rem' }}>💡 Pro Tip:</strong>
                    <p style={{ color: '#1e40af', margin: '4px 0 0 0', fontSize: '0.9rem' }}>{location.insiderTips}</p>
                  </div>
                )}
                
                {/* Clean Action Buttons at Bottom */}
                <div style={{ 
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    justifyContent: 'space-between'
                  }}>
                    <button
                      onClick={() => toggleFavorite(location.id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        flex: '1'
                      }}
                    >
                      💔 Remove
                    </button>
                    
                    <button
                      onClick={() => shareActivity(location)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        flex: '1'
                      }}
                    >
                      📤 Share
                    </button>
                    
                    <button
                      onClick={() => getDirections(location.address)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: '#10b981',
                        color: 'white',
                        flex: '1'
                      }}
                    >
                      🗺️ Directions
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
          <p>Built by a parent, for parents ❤️</p>
        </footer>
      </div>
    );
  }

  // About page
  if (currentPage === 'about') {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ color: '#6366f1', fontSize: '3rem', marginBottom: '8px', margin: '0' }}>🌟 Tot Trot</h1>
              <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>About Our Mission</p>
            </div>
            <button
              onClick={() => setCurrentPage('home')}
              style={{
                padding: '12px 24px',
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
        </header>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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

  // Main app with Mad Lib filters
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* New Header Design */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ color: '#6366f1', fontSize: '3rem', marginBottom: '8px', margin: '0' }}>
              🌟 Tot Trot
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0', marginBottom: '15px' }}>
              Built by parents, tested by kids
            </p>
          </div>
          
          {/* Centered Action buttons */}
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
                fontWeight: 'bold',
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
                fontWeight: 'bold',
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
          <h3 style={{ color: '#374151', fontSize: '1.3rem', margin: '0', marginBottom: '20px' }}>Tell us what you're looking for:</h3>
          
          <div style={{ fontSize: '1.2rem', color: '#374151', lineHeight: '1.8', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <span>Got</span>
            <select 
              value={filters.duration} 
              onChange={(e) => handleFilterChange('duration', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #6366f1', fontSize: '16px', fontWeight: 'bold', color: '#6366f1', backgroundColor: '#f0f4ff' }}
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
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #7c3aed', fontSize: '16px', fontWeight: 'bold', color: '#7c3aed', backgroundColor: '#f3f0ff' }}
            >
              <option value="All Ages">kid</option>
              {Object.entries(locationsData.filterOptions.ageRanges).map(([key, label]) => (
                <option key={key} value={key}>{label.toLowerCase()}</option>
              ))}
            </select>
            
            <span>who loves</span>
            <select 
              value={filters.interest} 
              onChange={(e) => handleFilterChange('interest', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #059669', fontSize: '16px', fontWeight: 'bold', color: '#059669', backgroundColor: '#f0fdf4' }}
            >
              <option value="All Interests">everything</option>
              {Object.entries(locationsData.filterOptions.interests).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            
            <span>near</span>
            <select 
              value={filters.location} 
              onChange={(e) => handleFilterChange('location', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #dc2626', fontSize: '16px', fontWeight: 'bold', color: '#dc2626', backgroundColor: '#fef2f2' }}
            >
              <option value="All Regions">anywhere</option>
              {Object.keys(locationsData.filterOptions.regions).filter(region => region !== 'All Regions').map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            
            <span style={{ fontWeight: 'bold' }}>? Show me options!</span>
          </div>
        </div>
      </div>

      {/* Results Summary - AFTER filters */}
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
        <p style={{ color: '#374151', margin: '0', fontSize: '1.1rem', fontWeight: 'bold' }}>
          🎯 {filteredLocations.length} amazing places found
        </p>
        {userLocation && (
          <p style={{ color: '#10b981', fontSize: '14px', margin: '5px 0 0 0' }}>
            📍 Sorted by distance from your location
          </p>
        )}
      </div>

      {/* Results with New Card Design */}
      <div style={{ display: 'grid', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        {filteredLocations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '1.5rem', color: '#6b7280' }}>No locations found with current filters</p>
            <button 
              onClick={() => setFilters({
                duration: 'All Durations',
                ageRange: 'All Ages',
                interest: 'All Interests',
                location: 'All Regions'
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
              Show All Activities
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
              {/* Header with address at top (Option 3 design) */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ color: '#1f2937', margin: 0, fontSize: '1.5rem', marginBottom: '8px' }}>
                  {location.name}
                </h3>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>
                  📍 {location.address}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  <span>🏙️ {location.city}, {location.region}</span>
                  <span>💰 {location.cost}</span>
                  <span>⏰ {locationsData.filterOptions.duration[location.duration]}</span>
                  {userLocation && (
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                      📍 {getDistanceText(location)}
                    </span>
                  )}
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
                  marginBottom: '16px'
                }}>
                  <strong style={{ color: '#1e40af', fontSize: '0.9rem' }}>💡 Pro Tip:</strong>
                  <p style={{ color: '#1e40af', margin: '4px 0 0 0', fontSize: '0.9rem' }}>{location.insiderTips}</p>
                </div>
              )}
              
              {/* Clean Action Buttons at Bottom */}
              <div style={{ 
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px',
                  justifyContent: 'space-between'
                }}>
                  <button
                    onClick={() => toggleFavorite(location.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: favorites.includes(location.id) ? '#ef4444' : '#f3f4f6',
                      color: favorites.includes(location.id) ? 'white' : '#374151',
                      flex: '1'
                    }}
                  >
                    {favorites.includes(location.id) ? '❤️ Saved' : '🤍 Save'}
                  </button>
                  
                  <button
                    onClick={() => shareActivity(location)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      flex: '1'
                    }}
                  >
                    📤 Share
                  </button>
                  
                  <button
                    onClick={() => getDirections(location.address)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: '#10b981',
                      color: 'white',
                      flex: '1'
                    }}
                  >
                    🗺️ Directions
                  </button>
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