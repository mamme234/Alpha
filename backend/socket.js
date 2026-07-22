// socket.js
import { getRedis } from './db.js';

let io = null;
const userSockets = new Map(); // userId -> socketId
const projectSockets = new Map(); // projectId -> [socketIds]

export const setupSockets = (socketIO) => {
  io = socketIO;
  
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User ${userId} connected`);
    
    // Store socket
    userSockets.set(userId, socket.id);
    
    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Handle joining project rooms
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);
      
      if (!projectSockets.has(projectId)) {
        projectSockets.set(projectId, []);
      }
      projectSockets.get(projectId).push(socket.id);
    });
    
    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`);
      
      const sockets = projectSockets.get(projectId) || [];
      const index = sockets.indexOf(socket.id);
      if (index > -1) {
        sockets.splice(index, 1);
      }
    });
    
    // Handle real-time code editing
    socket.on('code-change', (data) => {
      const { projectId, filePath, content } = data;
      socket.to(`project:${projectId}`).emit('code-update', {
        filePath,
        content,
        userId,
        timestamp: Date.now(),
      });
    });
    
    socket.on('cursor-move', (data) => {
      const { projectId, filePath, position } = data;
      socket.to(`project:${projectId}`).emit('cursor-update', {
        filePath,
        position,
        userId,
      });
    });
    
    // Handle deployment events
    socket.on('deploy', (data) => {
      // Deployment events handled via server -> client
    });
    
    socket.on('disconnect', () => {
      console.log(`🔌 User ${userId} disconnected`);
      userSockets.delete(userId);
      
      // Remove from project sockets
      for (const [projectId, sockets] of projectSockets) {
        const index = sockets.indexOf(socket.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
      }
    });
  });
  
  return io;
};

// Export functions to emit events from anywhere
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToProject = (projectId, event, data) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};

export const getSocket = () => io;
