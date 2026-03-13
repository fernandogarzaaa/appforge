import { EventEmitter } from 'events';
export var SwarmEvent;
(function (SwarmEvent) {
    SwarmEvent["SIGNAL_DETECTED"] = "SIGNAL_DETECTED";
    SwarmEvent["TASK_COMPLETED"] = "TASK_COMPLETED";
    SwarmEvent["ERROR_DETECTED"] = "ERROR_DETECTED";
    SwarmEvent["FACTORY_START"] = "FACTORY_START";
    SwarmEvent["BUILD_REQUEST"] = "BUILD_REQUEST";
})(SwarmEvent || (SwarmEvent = {}));
class SwarmComms extends EventEmitter {
    publish(event, payload) {
        console.log(`📡 SWARM_BUS [${event}]:`, payload);
        this.emit(event, payload);
    }
    subscribe(event, callback) {
        this.on(event, callback);
        return () => this.off(event, callback);
    }
}
export const swarmComms = new SwarmComms();
