// ... existing code ...
      <div className="map-container fixed-map">
        <GameMap 
          currentLocation={
            gameState.currentBar 
              ? [gameState.currentBar.latitude, gameState.currentBar.longitude]
              : undefined
          }
          bars={barsWithBeerEmoji}
          teamLocations={teamsWithCustomIcons}
          onBarClick={handleBarClick}
          isChicken={true}
          centerOnCurrentLocation={false}
        />
      </div>
// ... existing code ...