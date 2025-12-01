export class Joystick {
    constructor(zoneId, knobId, onMove) {
        this.zone = document.getElementById(zoneId);
        this.knob = document.getElementById(knobId);
        this.onMove = onMove; // Callback(x, y) normalized -1 to 1
        
        this.active = false;
        this.touchId = null;
        this.center = { x: 0, y: 0 };
        this.radius = this.zone.offsetWidth / 2;
        this.currentPos = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // Touch Events
        this.zone.addEventListener('touchstart', e => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.touchId = touch.identifier;
            this.start(touch.clientX, touch.clientY);
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            if (!this.active) return;
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    this.move(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                    break;
                }
            }
        }, { passive: false });

        window.addEventListener('touchend', e => {
            if (!this.active) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    this.end();
                    break;
                }
            }
        });

        // Mouse Events (for testing)
        this.zone.addEventListener('mousedown', e => {
            e.preventDefault();
            this.start(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', e => {
            if (this.active) {
                e.preventDefault();
                this.move(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mouseup', e => {
            if (this.active) {
                this.end();
            }
        });
    }

    start(clientX, clientY) {
        this.active = true;
        const rect = this.zone.getBoundingClientRect();
        this.center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        this.move(clientX, clientY);
    }

    move(clientX, clientY) {
        const dx = clientX - this.center.x;
        const dy = clientY - this.center.y;
        const distance = Math.hypot(dx, dy);
        const maxDistance = this.radius - this.knob.offsetWidth / 2;

        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(distance, maxDistance);

        const x = Math.cos(angle) * clampedDist;
        const y = Math.sin(angle) * clampedDist;

        this.knob.style.transform = `translate(${x}px, ${y}px)`;
        
        // Normalize output -1 to 1
        this.onMove(x / maxDistance, y / maxDistance);
    }

    end() {
        this.active = false;
        this.touchId = null;
        this.knob.style.transform = `translate(0px, 0px)`;
        this.onMove(0, 0);
    }
}
