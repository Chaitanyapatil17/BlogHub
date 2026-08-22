const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { JWT_SECRET } = require('./middleware/auth');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    // Authenticate user socket connection
    const token = socket.handshake.auth.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        const role = decoded.role;

        // Join personal user room
        socket.join(`user_${userId}`);

        // If admin, join admin room
        if (role === 'admin') {
          socket.join('admin_room');
        }

        console.log(`🔌 Socket connected: User ${userId} (${role}) [Socket ID: ${socket.id}]`);
      } catch (err) {
        console.log('🔌 Socket connected: Guest [Socket ID: ' + socket.id + ']');
      }
    } else {
      console.log('🔌 Socket connected: Guest [Socket ID: ' + socket.id + ']');
    }

    // Allow clients to join a specific blog room for real-time article comments and likes
    socket.on('join_blog', (blogIdOrSlug) => {
      if (blogIdOrSlug) {
        socket.join(`blog_${blogIdOrSlug}`);
      }
    });

    socket.on('leave_blog', (blogIdOrSlug) => {
      if (blogIdOrSlug) {
        socket.leave(`blog_${blogIdOrSlug}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
}

// 1. Real-time notifications for specific user
async function notifyUser({ userId, title, message, link }) {
  try {
    const result = await db.query(
      `INSERT INTO notifications (user_id, title, message, link, is_read)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [userId, title, message, link || '']
    );

    const notification = result.rows[0];

    if (io) {
      io.to(`user_${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error in notifyUser:', error);
  }
}

// 2. Real-time notifications for all admins
async function notifyAdmins({ title, message, link }) {
  try {
    const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");

    for (const admin of admins.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, link, is_read)
         VALUES ($1, $2, $3, $4, false)`,
        [admin.id, title, message, link || '/admin']
      );
    }

    if (io) {
      io.to('admin_room').emit('notification', {
        title,
        message,
        link: link || '/admin',
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in notifyAdmins:', error);
  }
}

// 3. Broadcast when a blog is published/approved live
function broadcastBlogPublished(blogData) {
  if (io) {
    io.emit('blog_published', blogData);
    io.emit('stats_updated');
  }
}

// 4. Broadcast when a blog request is created/approved/rejected
function broadcastBlogRequestsUpdated(data) {
  if (io) {
    io.emit('blog_requests_updated', data);
    io.emit('stats_updated');
  }
}

// 5. Broadcast when a blog is deleted
function broadcastBlogDeleted(blogId) {
  if (io) {
    io.emit('blog_deleted', { blogId });
    io.emit('stats_updated');
  }
}

// 6. Broadcast when a blog is liked/unliked
function broadcastBlogLiked(blogId, slug, likeCount, userId, isLiked) {
  if (io) {
    io.emit('blog_liked', { blogId, slug, likeCount, userId, isLiked });
    if (blogId) io.to(`blog_${blogId}`).emit('blog_liked', { blogId, slug, likeCount, userId, isLiked });
    if (slug) io.to(`blog_${slug}`).emit('blog_liked', { blogId, slug, likeCount, userId, isLiked });
  }
}

// 7. Broadcast when a comment is posted
function broadcastCommentAdded(blogId, slug, comment) {
  if (io) {
    io.emit('comment_added', { blogId, slug, comment });
    if (blogId) io.to(`blog_${blogId}`).emit('comment_added', { blogId, slug, comment });
    if (slug) io.to(`blog_${slug}`).emit('comment_added', { blogId, slug, comment });
    io.emit('stats_updated');
  }
}

// 8. Broadcast when a comment is deleted
function broadcastCommentDeleted(blogId, slug, commentId) {
  if (io) {
    io.emit('comment_deleted', { blogId, slug, commentId });
    if (blogId) io.to(`blog_${blogId}`).emit('comment_deleted', { blogId, slug, commentId });
    if (slug) io.to(`blog_${slug}`).emit('comment_deleted', { blogId, slug, commentId });
    io.emit('stats_updated');
  }
}

// 9. Broadcast when advertisements change
function broadcastAdvertisementUpdated(ad) {
  if (io) {
    io.emit('advertisement_updated', ad);
  }
}

module.exports = {
  initSocket,
  notifyUser,
  notifyAdmins,
  broadcastBlogPublished,
  broadcastBlogRequestsUpdated,
  broadcastBlogDeleted,
  broadcastBlogLiked,
  broadcastCommentAdded,
  broadcastCommentDeleted,
  broadcastAdvertisementUpdated,
  getIo: () => io,
};
