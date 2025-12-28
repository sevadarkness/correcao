// content/utils/logger.js - Logger utility with levels and context

class Logger {
    constructor(context = 'WHL', level = 'info') {
        this.context = context;
        this.level = level;
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        this.timers = new Map();
    }

    _shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }

    _formatMessage(level, ...args) {
        const timestamp = new Date().toISOString().substr(11, 8);
        const emoji = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌'
        }[level] || '';
        
        return [`[${timestamp}] [${this.context}] ${emoji}`, ...args];
    }

    debug(...args) {
        if (this._shouldLog('debug')) {
            console.debug(...this._formatMessage('debug', ...args));
        }
    }

    info(...args) {
        if (this._shouldLog('info')) {
            console.info(...this._formatMessage('info', ...args));
        }
    }

    warn(...args) {
        if (this._shouldLog('warn')) {
            console.warn(...this._formatMessage('warn', ...args));
        }
    }

    error(...args) {
        if (this._shouldLog('error')) {
            console.error(...this._formatMessage('error', ...args));
        }
    }

    // Replacement for empty catch blocks
    caught(error, context = '') {
        this.error(`Caught error${context ? ' in ' + context : ''}:`, error);
    }

    // Performance timing
    time(label) {
        this.timers.set(label, performance.now());
        this.debug(`⏱️ Timer started: ${label}`);
    }

    timeEnd(label) {
        const startTime = this.timers.get(label);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.timers.delete(label);
            this.info(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
            return duration;
        } else {
            this.warn(`⏱️ Timer not found: ${label}`);
            return 0;
        }
    }

    // Create child logger with additional context
    child(childContext) {
        return new Logger(`${this.context}:${childContext}`, this.level);
    }

    // Set log level dynamically
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.level = level;
            this.info(`Log level set to: ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}`);
        }
    }

    // Group logging
    group(label) {
        if (this._shouldLog('info')) {
            console.group(...this._formatMessage('info', label));
        }
    }

    groupEnd() {
        if (this._shouldLog('info')) {
            console.groupEnd();
        }
    }
}

// Create default logger instance
const logger = new Logger('WHL', 'info');

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Logger, logger };
}
