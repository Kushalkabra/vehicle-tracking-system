import { useVehicleStore } from '../stores/vehicleStore';

interface SimulatedVehicle {
  id: string;
  position: google.maps.LatLngLiteral;
  isMoving: boolean;
  lastUpdate: Date;
  stopStartTime?: Date;
}

export class TestSimulation {
  private vehicle: SimulatedVehicle;
  private moveInterval: number | null = null;
  private store = useVehicleStore.getState();
  private stoppedPosition: google.maps.LatLngLiteral | null = null;
  private STOP_THRESHOLD = 30 * 1000;

  constructor() {
    this.vehicle = {
      id: 'test-vehicle',
      position: { lat: 40.7128, lng: -74.0060 },
      isMoving: true,
      lastUpdate: new Date()
    };
  }

  start() {
    this.store.addVehicle({
      id: this.vehicle.id,
      name: 'Test Vehicle',
      position: this.vehicle.position,
      status: 'active',
      lastUpdate: new Date()
    });

    this.vehicle.isMoving = true;
    this.vehicle.stopStartTime = undefined;
    this.updatePosition();
    this.moveInterval = window.setInterval(() => this.updatePosition(), 2000);
  }

  stop() {
    this.vehicle.isMoving = false;
    this.stoppedPosition = { ...this.vehicle.position };
    this.vehicle.stopStartTime = new Date();
    
    this.store.addStopPoint(this.vehicle.position);
    
    this.updatePosition();
  }

  resume() {
    if (this.vehicle.stopStartTime) {
      const ongoingStop = this.store.routeHistory.stops.find(stop => !stop.endTime);
      if (ongoingStop) {
        this.store.updateStopPoint(ongoingStop.id, new Date());
      }
    }

    this.vehicle.isMoving = true;
    this.stoppedPosition = null;
    this.vehicle.stopStartTime = undefined;
    this.updatePosition();
  }

  cleanup() {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
    const ongoingStop = this.store.routeHistory.stops.find(stop => !stop.endTime);
    if (ongoingStop) {
      this.store.updateStopPoint(ongoingStop.id, new Date());
    }
    this.store.removeVehicle(this.vehicle.id);
    this.store.clearRouteHistory();
  }

  private updatePosition() {
    if (this.stoppedPosition) {
      this.vehicle.position = this.stoppedPosition;
    } else if (this.vehicle.isMoving) {
      this.vehicle.position = {
        lat: this.vehicle.position.lat + (Math.random() - 0.5) * 0.005,
        lng: this.vehicle.position.lng + (Math.random() - 0.5) * 0.005,
      };
    }

    this.vehicle.lastUpdate = new Date();

    this.store.updateVehiclePosition(
      this.vehicle.id,
      this.vehicle.position.lat,
      this.vehicle.position.lng
    );

    this.store.addRoutePoint(this.vehicle.position);

    if (!this.vehicle.isMoving && this.vehicle.stopStartTime) {
      const stopDuration = new Date().getTime() - this.vehicle.stopStartTime.getTime();
      if (stopDuration >= this.STOP_THRESHOLD) {
        const ongoingStop = this.store.routeHistory.stops.find(stop => !stop.endTime);
        if (ongoingStop) {
          this.store.updateStopDuration(ongoingStop.id, stopDuration);
        }
      }
    }
  }

  getStatus() {
    return {
      isMoving: this.vehicle.isMoving,
      position: this.vehicle.position,
      lastUpdate: this.vehicle.lastUpdate,
      stopDuration: this.vehicle.stopStartTime 
        ? new Date().getTime() - this.vehicle.stopStartTime.getTime() 
        : 0
    };
  }
}

export const checkStopDetection = () => {
  const store = useVehicleStore.getState();
  const stops = store.routeHistory.stops;
  
  if (stops.length === 0) {
    console.log('No stops detected');
    return [];
  }

  const stopsInfo = stops.map(stop => {
    const duration = stop.duration || 
      (stop.endTime ? new Date(stop.endTime).getTime() - new Date(stop.startTime).getTime() : 
      new Date().getTime() - new Date(stop.startTime).getTime());

    const isLongEnough = duration >= 30000; // 30 seconds threshold

    return {
      id: stop.id,
      startTime: stop.startTime,
      endTime: stop.endTime || 'ongoing',
      duration: isLongEnough 
        ? `${(duration / 1000 / 60).toFixed(1)} minutes`
        : 'not long enough',
      position: stop.position,
      isValid: isLongEnough
    };
  });

  // Filter out stops that haven't met the threshold
  const validStops = stopsInfo.filter(stop => stop.isValid);
  
  if (validStops.length === 0) {
    console.log('No valid stops detected (< 30 seconds)');
    return [];
  }

  console.log('Detected valid stops:', validStops);
  return validStops;
}; 