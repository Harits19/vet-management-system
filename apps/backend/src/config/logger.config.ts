


export class LoggerConfig {
    private prefix: string
    private parent?: LoggerConfig;
    constructor({ prefix, parent }: { prefix: string, parent?: LoggerConfig }) {
        this.prefix = prefix;
        this.parent = parent;
    }

    get key(): String {
        if (this.parent) {
            return `${this.parent.key}.${this.prefix}`
        } else {
            return `${this.prefix}`
        }
    }


    log(message: string, meta?: Record<string, any>) {
        console.log(`${this.key} ${message}`, meta ? JSON.stringify(meta) : undefined);
    }

    error(message: string, error: unknown) {
        const meta: {
            stack?: string,
            message: string,
            error: unknown,
        } = {
            stack: 'Unexpected stack',
            message: 'Unexpected error',
            error: undefined,
        }

        if (error instanceof Error) {
            meta.stack = error.stack;
            meta.message = error.message;
        } else if (typeof error === 'string') {
            meta.message = error;
            meta.stack = error;
        } else {
            console.log(`${this.key} Untraced error`, error)
        }


        console.log(`${this.key} ${message}`, JSON.stringify(meta))
    }
}