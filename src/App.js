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
      <div style={{ padding: '20px', fontFamily: '"Space Grotesk", sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontFamily: '"Fredoka One", cursive', color: '#6366f1', fontSize: '3rem', marginBottom: '8px', margin: '0' }}>Tot Trot</h1>
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
                fontWeight: '600',
                fontFamily: '"Space Grotesk", sans-serif'
              }}
            >
              ← Back to Activities
            </button>
          </div>
        </header>

        {savedLocations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💔</div>
            <h2 style={{ color: '#6b7280', fontSize: '1.5rem', marginBottom: '15px', fontFamily: '"Space Grotesk", sans-serif' }}>No saved activities yet!</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '1.1rem', fontFamily: '"Space Grotesk", sans-serif' }}>
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
                fontWeight: '600',
                fontFamily: '"Space Grotesk", sans-serif'
              }}
            >
              Discover Activities
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
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                fontFamily: '"Space Grotesk", sans-serif'
              }}>
                {/* Header with address at top */}
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ color: '#1f2937', margin: 0, fontSize: '1.5rem', marginBottom: '8px', fontWeight: '600' }}>
                    {location.name}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                    📍 {location.address}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    <span>🏙️ {location.city}, {location.region}</span>
                    <span>💰 {location.cost}</span>
                    <span>⏰ {locationsData.filterOptions.duration[location.duration]}</span>
                  </div>
                </div>
                
                {/* Parent Review */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: '#1f2937', fontSize: '1.1rem', marginBottom: '8px', fontWeight: '600' }}>
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
                    <strong style={{ color: '#1e40af', fontSize: '0.9rem', fontWeight: '600' }}>💡 Pro Tip:</strong>
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
                        fontWeight: '600',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        flex: '1',
                        fontFamily: '"Space Grotesk", sans-serif'
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
                        fontWeight: '600',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        flex: '1',
                        fontFamily: '"Space Grotesk", sans-serif'
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
                        fontWeight: '600',
                        backgroundColor: '#10b981',
                        color: 'white',
                        flex: '1',
                        fontFamily: '"Space Grotesk", sans-serif'
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

        <footer style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280', fontFamily: '"Space Grotesk", sans-serif' }}>
          <p>Built by a parent, for parents ❤️</p>
        </footer>
      </div>
    );
  }

  // About page with new content
  if (currentPage === 'about') {
    return (
      <div style={{ padding: '20px', fontFamily: '"Space Grotesk", sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontFamily: '"Fredoka One", cursive', color: '#6366f1', fontSize: '3rem', marginBottom: '8px', margin: '0' }}>Tot Trot</h1>
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
                fontWeight: '600'
              }}
            >
              ← Back to Activities
            </button>
          </div>
        </header>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h2 style={{ color: '#1f2937', fontSize: '2rem', marginBottom: '30px', fontWeight: '700' }}>About Tot Trot</h2>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#6366f1', fontSize: '1.3rem', marginBottom: '15px', fontWeight: '600' }}>🎯 What Makes Us Different</h3>
              <p style={{ color: '#1f2937', fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px' }}>
                87 hidden gems discovered by real Bay Area parents.
              </p>
              <p style={{ color: '#4b5563', marginBottom: '20px' }}>
                No tourist traps, no generic recommendations – just authentic spots where local families actually love to go.
              </p>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#6366f1', fontSize: '1.3rem', marginBottom: '15px', fontWeight: '600' }}>What You Get Right Now</h3>
              <ul style={{ color: '#4b5563', marginLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>Real parent intel</strong> – Quotes, tips, and honest reviews from families who've been there</li>
                <li><strong>Distance-smart results</strong> – Everything sorted by how close it is to you</li>
                <li><strong>Age-perfect matches</strong> – Filters that actually understand child development (0-8 years)</li>
                <li><strong>Bookmark & share</strong> – Save favorites and share discoveries with other parents</li>
                <li><strong>Instant directions</strong> – One tap to Google Maps</li>
                <li><strong>Community-sourced</strong> – Built from Reddit threads, parent Facebook groups, and local wisdom</li>
              </ul>
            </div>

            <div style={{ backgroundColor: '#fef3c7', padding: '25px', borderRadius: '8px', marginBottom: '30px' }}>
              <h3 style={{ color: '#92400e', fontSize: '1.3rem', marginBottom: '15px', fontWeight: '600' }}>🚀 The Story Behind Tot Trot</h3>
              <p style={{ color: '#92400e', marginBottom: '15px' }}>
                I moved to the Bay Area in 2022, and after having my kid, I was excited to explore this incredible place as a new parent. But I quickly hit a wall – every "family-friendly" list was the same recycled tourist spots everyone already knows about.
              </p>
              <p style={{ color: '#92400e', marginBottom: '15px', fontWeight: '600' }}>
                I wanted to discover the Bay Area WITH my kid, not despite having one.
              </p>
              <p style={{ color: '#92400e', marginBottom: '15px' }}>
                Instead of always being the person asking "so... what should we do this weekend?" I wanted to be the one with the perfect hidden gem suggestion.
              </p>
              <p style={{ color: '#92400e', marginBottom: '15px' }}>
                So I did what any curious parent would do – I asked the internet. One simple Reddit post asking Bay Area parents for their favorite kid-friendly spots exploded into 150+ comments and 450+ shares. Parents were hungry to share their secret spots and learn about new ones.
              </p>
              <p style={{ color: '#92400e', marginBottom: '15px', fontWeight: '600' }}>
                That's when I realized: the best family activities aren't found in guidebooks – they're shared between parents.
              </p>
              <p style={{ color: '#92400e', fontStyle: 'italic' }}>
                – Anoushka Garg, parent to an unstoppable toddler
              </p>
            </div>

            <div style={{ backgroundColor: '#dbeafe', padding: '25px', borderRadius: '8px', marginBottom: '30px' }}>
              <h3 style={{ color: '#1e40af', fontSize: '1.3rem', marginBottom: '15px', fontWeight: '600' }}>🌟 The Vision</h3>
              <p style={{ color: '#1e40af', marginBottom: '15px' }}>
                Tot Trot isn't just an app – it's a community where Bay Area parents discover, share, and plan adventures together.
              </p>
              <p style={{ color: '#1e40af', marginBottom: '15px' }}>
                Whether you're having an "we need to get out of the house NOW" moment or planning ahead with other parent friends, we want to be your go-to resource.
              </p>
              <p style={{ color: '#1e40af', fontWeight: '600' }}>
                No more decision fatigue. No more backup plan panic. Just great local spots that real families actually love.
              </p>
            </div>

            <div style={{ backgroundColor: '#ecfdf5', padding: '25px', borderRadius: '8px' }}>
              <h3 style={{ color: '#065f46', fontSize: '1.3rem', marginBottom: '15px', fontWeight: '600' }}>📍 This Is Just the Beginning</h3>
              <p style={{ color: '#065f46', marginBottom: '15px' }}>
                We're starting with our curated collection of 87 parent-tested locations, but this is only phase one. Your feedback determines what we build next – because the best family app is built BY parents, FOR parents.
              </p>
              <p style={{ color: '#065f46', fontWeight: '600' }}>
                Ready to discover your new favorite spot?
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
                fontWeight: '600'
              }}
            >
              💌 Send Feedback
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Main app with all updates
  return (
    <div style={{ padding: '20px', fontFamily: '"Space Grotesk", sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Updated Header */}
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

      {/* Mad Lib Style Filters with updates */}
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
            <select 
              value={filters.interest} 
              onChange={(e) => handleFilterChange('interest', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #059669', fontSize: '16px', fontWeight: '600', color: '#059669', backgroundColor: '#f0fdf4', fontFamily: '"Space Grotesk", sans-serif' }}
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
              style={{ padding: '8px 12px', borderRadius: '6px', border: '2px solid #dc2626', fontSize: '16px', fontWeight: '600', color: '#dc2626', backgroundColor: '#fef2f2', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              <option value="All Regions">anywhere</option>
              {Object.keys(locationsData.filterOptions.regions).filter(region => region !== 'All Regions').map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            
            <span>?</span>
          </div>
          
          {/* Black "Show me options" button */}
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

      {/* Results Summary - AFTER filters with grey text */}
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
          🎯 {filteredLocations.length} amazing places found
        </p>
        {userLocation && (
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>
            📍 Sorted by distance from your location
          </p>
        )}
      </div>

      {/* Results with Updated Card Design - removed filter info */}
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
                cursor: 'pointer',
                fontWeight: '600'
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
              {/* Header with address at top - removed filter info */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ color: '#1f2937', margin: 0, fontSize: '1.5rem', marginBottom: '8px', fontWeight: '600' }}>
                  {location.name}
                </h3>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                  📍 {location.address}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  <span>🏙️ {location.city}, {location.region}</span>
                  <span>💰 {location.cost}</span>
                  <span>⏰ {locationsData.filterOptions.duration[location.duration]}</span>
                  {userLocation && (
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>
                      📍 {getDistanceText(location)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Parent Review */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#1f2937', fontSize: '1.1rem', marginBottom: '8px', fontWeight: '600' }}>
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
                  <strong style={{ color: '#1e40af', fontSize: '0.9rem', fontWeight: '600' }}>💡 Pro Tip:</strong>
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
                      fontWeight: '600',
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
                      fontWeight: '600',
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
                      fontWeight: '600',
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