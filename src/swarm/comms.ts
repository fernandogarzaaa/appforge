import { EventEmitter } from 'events';

export enum SwarmEvent {
    SIGNAL_DETECTED = 'SIGNAL_DETECTED',
    TASK_COMPLETED = 'TASK_COMPLETED',
    ERROR_DETECTED = 'ERROR_DETECTED',
    FACTORY_START = 'FACTORY_START',
    BUILD_REQUEST = 'BUILD_REQUEST'
}

class SwarmComms extends EventEmitter {
    publish(event: SwarmEvent, payload: any) {
        console.log(`📡 SWARM_BUS [${event}]:`, payload);
        this.emit(event, payload);
    }

    subscribe(event: SwarmEvent, callback: (payload: any) => void) {
        this.on(event, callback);
        return () => this.off(event, callback);
    }
}

export const swarmComms = new SwarmComms();
