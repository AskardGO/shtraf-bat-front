class ActivityTracker {
    private static instance: ActivityTracker;
    private lastActivityTime: number = Date.now();
    private isActive: boolean = true;
    private inactivityTimeout: number | null = null;
    private callbacks: Array<(isActive: boolean) => void> = [];
    private readonly INACTIVITY_THRESHOLD = 60000;

    private constructor() {
        this.setupEventListeners();
        this.startInactivityTimer();
    }

    public static getInstance(): ActivityTracker {
        if (!ActivityTracker.instance) {
            ActivityTracker.instance = new ActivityTracker();
        }
        return ActivityTracker.instance;
    }

    private setupEventListeners() {
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
            'keydown'
        ];

        events.forEach(event => {
            document.addEventListener(event, this.handleActivity.bind(this), true);
        });

        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        window.addEventListener('blur', this.handleWindowBlur.bind(this));
    }

    private handleActivity = () => {
        this.lastActivityTime = Date.now();

        if (!this.isActive) {
            this.isActive = true;
            this.notifyCallbacks(true);
        }

        this.resetInactivityTimer();
    };

    private handleVisibilityChange = () => {
        if (document.hidden) {
            this.setInactive();
        } else {
            this.handleActivity();
        }
    };

    private handleWindowFocus = () => {
        this.handleActivity();
    };

    private handleWindowBlur = () => {
        this.resetInactivityTimer();
    };

    private startInactivityTimer() {
        this.resetInactivityTimer();
    }

    private resetInactivityTimer() {
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
        }

        this.inactivityTimeout = setTimeout(() => {
            this.setInactive();
        }, this.INACTIVITY_THRESHOLD);
    }

    private setInactive() {
        if (this.isActive) {
            this.isActive = false;
            this.notifyCallbacks(false);
        }
    }

    private notifyCallbacks(isActive: boolean) {
        this.callbacks.forEach(callback => {
            try {
                callback(isActive);
            } catch (error) {
                console.error('Error in activity callback:', error);
            }
        });
    }

    public onActivityChange(callback: (isActive: boolean) => void) {
        this.callbacks.push(callback);

        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }

    public getIsActive(): boolean {
        return this.isActive;
    }

    public getLastActivityTime(): number {
        return this.lastActivityTime;
    }

    public getTimeSinceLastActivity(): number {
        return Date.now() - this.lastActivityTime;
    }

    public destroy() {
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
        }
        this.callbacks = [];
    }
}

export const activityTracker = ActivityTracker.getInstance();
