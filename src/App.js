import React, { useState } from 'react';
import locationsData from './data/locations.json';

function App() {
  const [locations] = useState(locationsData.locations);
  const [filterRegion, setFilterRegion] = useState('All');
  
  const filteredLocations = filterRegion === 'All' 
    ? locations 
    : locations.filter(loc => loc.region === filterRegion);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#6366f1', fontSize: '3rem', marginBottom: '10px' }}>🌟 Tot Trot</h1>
        <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>Parent-Approved Activities in the Bay Area</p>
        <p style={{ color: '#6b7280' }}>{filteredLocations.length} amazing places found</p>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
          🌍 Filter by Region:
        </label>
        <select 
          value={filterRegion} 
          onChange={(e) => setFilterRegion(e.target.value)}
          style={{ 
            padding: '10px', 
            borderRadius: '8px', 
            border: '2px solid #d1d5db',
            fontSize: '16px',
            minWidth: '200px'
          }}
        >
          <option value="All">All Regions</option>
          <option value="East Bay">East Bay</option>
          <option value="Peninsula">Peninsula</option>
          <option value="South Bay">South Bay</option>
          <option value="San Francisco">San Francisco</option>
          <option value="North Bay">North Bay</option>
        </select>
      </div>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {filteredLocations.map(location => (
          <div key={location.id} style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '12px', 
            padding: '24px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '1.5rem' }}>
                {location.name}
              </h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#6b7280' }}>
                <span>📍 {location.region}</span>
                <span>💰 {location.cost}</span>
                <span>👶 Ages {location.ageRange}</span>
                <span>🎯 {location.type}</span>
              </div>
            </div>
            
            <blockquote style={{ 
              fontStyle: 'italic', 
              color: '#374151', 
              borderLeft: '4px solid #6366f1',
              paddingLeft: '16px',
              marginBottom: '16px',
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '6px'
            }}>
              "{location.parentQuote}"
            </blockquote>
            
            <div style={{ 
              backgroundColor: '#eff6ff', 
              padding: '12px', 
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <strong style={{ color: '#1e40af' }}>💡 Insider Tip:</strong>
              <p style={{ color: '#1e40af', margin: '4px 0 0 0' }}>{location.insiderTips}</p>
            </div>
            
            <div style={{ 
              fontSize: '14px',
              color: '#6b7280',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '12px'
            }}>
              📍 {location.address}
            </div>
          </div>
        ))}
      </div>

      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
        <p>Built by parents, for parents ❤️</p>
      </footer>
    </div>
  );
}

export default App;