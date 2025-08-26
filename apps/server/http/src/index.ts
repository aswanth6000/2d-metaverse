import dotenv from 'dotenv';
import app from './app';

// Load environment variables from .env file
dotenv.config();

// Determine the port from environment variables, with a fallback
const PORT = process.env.PORT || 3001;

// Start the server and listen on the specified port
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running and listening on port ${PORT}`);
});

// Optional: Handle process termination gracefully
const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: Error) => {
  console.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  if (server) {
    server.close();
  }
});
