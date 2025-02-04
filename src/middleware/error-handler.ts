import { logger } from '../utils/logger';

export class ErrorHandler {
    public static handle(error: Error): void {
        logger.error('Unhandled error:', error);
        
        // Implement custom error handling logic here
        if (error instanceof TypeError) {
            // Handle type errors
            logger.error('Type error detected:', error);
        } else if (error.message.includes('database')) {
            // Handle database errors
            logger.error('Database error detected:', error);
        } else if (error.message.includes('redis')) {
            // Handle Redis errors
            logger.error('Redis error detected:', error);
        }
        
        // You might want to send error notifications here
        this.notifyError(error);
    }

    private static async notifyError(error: Error): Promise<void> {
        // Implement error notification logic (e.g., send to monitoring service)
        // This is a placeholder for now
        logger.info('Error notification would be sent here');
    }
}

// Global error handler
process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Rejection:', reason);
    ErrorHandler.handle(reason);
});

process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    ErrorHandler.handle(error);
    // Give time for logs to be written before exiting
    setTimeout(() => process.exit(1), 1000);
});