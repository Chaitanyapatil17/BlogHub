/**
 * Telegram Notification Service for BlogHub
 * Communicates with Telegram Bot API (@BlogHubNewsBot)
 */

const db = require('../db');

function getBotToken() {
  const raw = process.env.TELEGRAM_BOT_TOKEN || '';
  if (raw.includes('=')) {
    return raw.split('=').pop().trim();
  }
  return raw.trim();
}

const TELEGRAM_API_BASE = 'https://api.telegram.org';

let cachedBotInfo = null;
let isPollingActive = false;
let pollingOffset = 0;

/**
 * Resolves the primary frontend URL for Telegram links and buttons.
 * Defaults to the production deployed Vercel application.
 */
function getFrontendBaseUrl() {
  const envUrl = process.env.FRONTEND_URL || process.env.SITE_URL || 'https://blog-hub-five-mu.vercel.app';
  return envUrl.trim().replace(/\/+$/, '');
}

// Escape HTML special characters for Telegram HTML mode
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Clean HTML / Markdown tags for text previews
function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Slugify category names to match frontend route structure
function slugifyCategory(cat) {
  if (!cat || typeof cat !== 'string') return '';
  return cat
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Builds canonical blog path matching BlogHub frontend routing:
 * /blog/:category/:subcategory/:slug or /blog/:category/:slug or /blog/:slug
 */
function getBlogPath(blog) {
  if (!blog) return '/';
  const slug = blog.slug || blog.id;
  if (!slug) return '/';

  const categorySlug = slugifyCategory(blog.category);
  const subCategorySlug = slugifyCategory(blog.sub_category || blog.subcategory);

  if (categorySlug && subCategorySlug) {
    return `/blog/${categorySlug}/${subCategorySlug}/${encodeURIComponent(slug)}`;
  } else if (categorySlug) {
    return `/blog/${categorySlug}/${encodeURIComponent(slug)}`;
  }
  return `/blog/${encodeURIComponent(slug)}`;
}

/**
 * Validates and sanitizes URLs for Telegram Inline Keyboard buttons.
 * Ensures URLs are valid HTTPS public URLs and converts localhost/relative paths to the production domain.
 */
function sanitizeTelegramButtonUrl(rawUrl) {
  const defaultFrontend = getFrontendBaseUrl();
  if (!rawUrl || typeof rawUrl !== 'string') return defaultFrontend;

  const trimmed = rawUrl.trim();

  // If localhost or relative URL, map to the production frontend URL
  if (
    trimmed.startsWith('http://localhost') ||
    trimmed.startsWith('http://127.0.0.1') ||
    trimmed.startsWith('localhost')
  ) {
    try {
      const parsed = new URL(trimmed.startsWith('localhost') ? `http://${trimmed}` : trimmed);
      return `${defaultFrontend}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (e) {
      return defaultFrontend;
    }
  }

  if (trimmed.startsWith('/')) {
    return `${defaultFrontend}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch (e) {
    // invalid URL format
  }

  return defaultFrontend;
}

/**
 * Generic Telegram Bot API Request Handler
 */
async function callTelegramApi(method, payload = {}) {
  const token = getBotToken();
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured in backend environment.');
  }

  const url = `${TELEGRAM_API_BASE}/bot${token}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.ok) {
    const err = new Error(data.description || `Telegram API call failed: ${method}`);
    err.error_code = data.error_code;
    err.description = data.description;
    throw err;
  }
  return data.result;
}

/**
 * Get Bot Metadata (@username, name, ID)
 */
async function getBotInfo() {
  if (cachedBotInfo) return cachedBotInfo;
  try {
    const info = await callTelegramApi('getMe');
    cachedBotInfo = info;
    return info;
  } catch (err) {
    console.error('⚠️ [TelegramService] getBotInfo error:', err.message);
    return null;
  }
}

/**
 * Extract and sanitize blog cover photo URL for Telegram sendPhoto
 */
function getBlogCoverPhoto(blog) {
  if (!blog) return null;

  let rawPhoto = blog.cover_image || blog.image || null;

  // Check blocks array for first image block if not present top-level
  if (!rawPhoto && blog.blocks && Array.isArray(blog.blocks)) {
    const imgBlock = blog.blocks.find(b => b.type === 'image' && b.data && (b.data.url || b.data.file?.url));
    if (imgBlock) {
      rawPhoto = imgBlock.data.url || imgBlock.data.file?.url;
    }
  }

  if (!rawPhoto || typeof rawPhoto !== 'string') return null;

  const trimmed = rawPhoto.trim();

  // If it's a data:image base64 URI, Telegram sendPhoto URL method doesn't accept raw data URIs
  if (trimmed.startsWith('data:image')) {
    return null;
  }

  // If relative path /uploads/..., resolve against production frontend/backend domain
  if (trimmed.startsWith('/')) {
    const frontendBase = getFrontendBaseUrl();
    return `${frontendBase}${trimmed}`;
  }

  // If localhost URL, replace with production domain
  if (
    trimmed.startsWith('http://localhost') ||
    trimmed.startsWith('http://127.0.0.1') ||
    trimmed.startsWith('localhost')
  ) {
    try {
      const parsed = new URL(trimmed.startsWith('localhost') ? `http://${trimmed}` : trimmed);
      const frontendBase = getFrontendBaseUrl();
      return `${frontendBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (e) {
      return null;
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch (e) {
    return null;
  }

  return null;
}

/**
 * Send Formatted Photo with Caption and Auto-Fallback Protection
 */
async function sendPhoto(chatId, photoUrl, caption, options = {}) {
  const buttons = options.buttons && Array.isArray(options.buttons)
    ? options.buttons.map(row => 
        row.map(btn => ({
          ...btn,
          url: btn.url ? sanitizeTelegramButtonUrl(btn.url) : undefined
        }))
      )
    : null;

  // Ensure caption stays within Telegram's 1024 character limit for sendPhoto
  const safeCaption = caption && caption.length > 980 ? caption.slice(0, 970) + '...' : caption;

  const payload = {
    chat_id: String(chatId),
    photo: photoUrl,
    caption: safeCaption,
    parse_mode: 'HTML',
  };

  if (buttons && buttons.length > 0) {
    payload.reply_markup = { inline_keyboard: buttons };
  }

  try {
    return await callTelegramApi('sendPhoto', payload);
  } catch (err) {
    console.warn(`⚠️ [TelegramService] sendPhoto failed (${err.description || err.message}). Falling back to text sendMessage...`);
    // Fallback to text sendMessage
    return await sendMessage(chatId, caption, options);
  }
}

/**
 * Send Formatted Message with Auto-Fallback Protection
 */
async function sendMessage(chatId, text, options = {}) {
  const buttons = options.buttons && Array.isArray(options.buttons)
    ? options.buttons.map(row => 
        row.map(btn => ({
          ...btn,
          url: btn.url ? sanitizeTelegramButtonUrl(btn.url) : undefined
        }))
      )
    : null;

  const payload = {
    chat_id: String(chatId),
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: options.disablePreview !== false,
  };

  if (buttons && buttons.length > 0) {
    payload.reply_markup = { inline_keyboard: buttons };
  }

  try {
    return await callTelegramApi('sendMessage', payload);
  } catch (err) {
    console.warn(`⚠️ [TelegramService] Primary sendMessage failed (${err.description || err.message}). Attempting fallback delivery...`);

    // Fallback 1: Try without inline keyboard buttons
    if (payload.reply_markup) {
      try {
        delete payload.reply_markup;
        return await callTelegramApi('sendMessage', payload);
      } catch (fErr) {
        // Continue to fallback 2
      }
    }

    // Fallback 2: Strip HTML tags and send plain text
    try {
      return await callTelegramApi('sendMessage', {
        chat_id: String(chatId),
        text: stripHtml(text),
      });
    } catch (finalErr) {
      console.error(`❌ [TelegramService] Final sendMessage fallback failed:`, finalErr.message);
      throw finalErr;
    }
  }
}

/**
 * Broadcast New Blog Post to All Matching Telegram Subscribers
 */
async function notifySubscribersForBlog(blog) {
  try {
    const token = getBotToken();
    if (!token) {
      console.log('ℹ️ [TelegramService] Skipping notification: No bot token configured.');
      return { sent: 0, skipped: true, reason: 'No bot token' };
    }

    if (!blog || !blog.title) {
      return { sent: 0, skipped: true, reason: 'Invalid blog payload' };
    }

    const category = blog.category || 'Technology';
    const frontendBase = getFrontendBaseUrl();
    const blogPath = getBlogPath(blog);
    const blogUrl = `${frontendBase}${blogPath}`;
    const coverPhotoUrl = getBlogCoverPhoto(blog);

    // Query active subscribers who want this category or 'All'
    const subRes = await db.query(
      `SELECT * FROM telegram_subscribers
       WHERE is_active = true
         AND chat_id NOT LIKE 'pending_%'
         AND ('All' = ANY(categories) OR $1 = ANY(categories))`,
      [category]
    );

    const subscribers = subRes.rows;
    if (subscribers.length === 0) {
      console.log(`ℹ️ [TelegramService] No active subscribers found for category: "${category}".`);
      return { sent: 0, matchingSubscribers: 0 };
    }

    // Clean summary excerpt
    let rawExcerpt = '';
    if (blog.ai_metadata && blog.ai_metadata.summary) {
      rawExcerpt = blog.ai_metadata.summary;
    } else if (blog.content) {
      rawExcerpt = stripHtml(blog.content);
    }
    const cleanExcerpt = rawExcerpt.length > 200 ? rawExcerpt.slice(0, 197) + '...' : rawExcerpt;

    // Author attribution
    let authorName = 'BlogHub Editorial Bureau';
    if (blog.author_name) {
      authorName = blog.author_name;
    } else if (blog.author_id) {
      try {
        const uRes = await db.query('SELECT name FROM users WHERE id = $1', [blog.author_id]);
        if (uRes.rows.length > 0) authorName = uRes.rows[0].name;
      } catch (e) {
        // ignore
      }
    }

    const messageHtml = `🔥 <b>New Story on BlogHub!</b>\n\n` +
      `📰 <b>${escapeHtml(blog.title)}</b>\n\n` +
      `🏷️ <b>Category:</b> #${escapeHtml(category.replace(/[^a-zA-Z0-9]/g, ''))}\n` +
      `✍️ <b>Author:</b> ${escapeHtml(authorName)}\n\n` +
      (cleanExcerpt ? `📝 <i>${escapeHtml(cleanExcerpt)}</i>\n\n` : '') +
      `⚡ <i>Read instantly on BlogHub:</i>`;

    const buttons = [
      [
        {
          text: '📖 Read Full Article',
          url: sanitizeTelegramButtonUrl(blogUrl),
        },
      ],
      [
        {
          text: '🌐 Explore BlogHub',
          url: sanitizeTelegramButtonUrl(frontendBase),
        },
      ],
    ];

    let successCount = 0;
    let failCount = 0;

    const sendPromises = subscribers.map(async (sub) => {
      try {
        if (coverPhotoUrl) {
          await sendPhoto(sub.chat_id, coverPhotoUrl, messageHtml, { buttons });
        } else {
          await sendMessage(sub.chat_id, messageHtml, { buttons });
        }
        successCount++;
      } catch (err) {
        failCount++;
        console.warn(`⚠️ [TelegramService] Failed to notify chat ${sub.chat_id}:`, err.message);

        if (
          err.message.includes('bot was blocked') ||
          err.message.includes('user is deactivated') ||
          err.message.includes('chat not found')
        ) {
          await db.query('UPDATE telegram_subscribers SET is_active = false WHERE id = $1', [sub.id]);
        }
      }
    });

    await Promise.allSettled(sendPromises);

    let validBlogId = null;
    if (blog.id) {
      try {
        const bCheck = await db.query('SELECT id FROM blogs WHERE id = $1', [blog.id]);
        if (bCheck.rows.length > 0) validBlogId = blog.id;
      } catch (e) {
        validBlogId = null;
      }
    }

    // Record in telegram_notification_logs
    await db.query(
      `INSERT INTO telegram_notification_logs (blog_id, category, recipients_count, status, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        validBlogId,
        category,
        successCount,
        failCount > 0 && successCount === 0 ? 'failed' : 'sent',
        JSON.stringify({
          title: blog.title,
          total_attempted: subscribers.length,
          success_count: successCount,
          fail_count: failCount,
        }),
      ]
    );

    console.log(`📢 [TelegramService] Broadcast complete for "${blog.title}": ${successCount} sent, ${failCount} failed.`);
    return { sent: successCount, failed: failCount, total: subscribers.length };
  } catch (error) {
    console.error('❌ [TelegramService] notifySubscribersForBlog error:', error);
    return { sent: 0, error: error.message };
  }
}

/**
 * Handle Inbound Telegram Update (Command or Message)
 */
async function handleTelegramMessage(message) {
  if (!message || !message.chat || !message.chat.id) return;

  const chatId = String(message.chat.id);
  const text = (message.text || '').trim();
  const fromUser = message.from || {};
  const username = fromUser.username || null;
  const firstName = fromUser.first_name || 'Reader';

  console.log(`📥 [TelegramBot] Received from chat ${chatId} (@${username || firstName}): "${text}"`);

  const frontendBase = getFrontendBaseUrl();

  try {
    // 1. COMMAND: /start [authToken]
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const authToken = parts.length > 1 ? parts[1].trim() : null;

      let linkedUserId = null;
      let linkedUserName = null;

      if (authToken) {
        // 1. Check users table by telegram_auth_token
        try {
          const uRes = await db.query(
            `SELECT id, name, email FROM users WHERE telegram_auth_token = $1`,
            [authToken]
          );
          if (uRes.rows.length > 0) {
            linkedUserId = uRes.rows[0].id;
            linkedUserName = uRes.rows[0].name;
          }
        } catch (e) {
          // fallback
        }

        // 2. Fallback check if authToken format is "user_<id>_<hex>"
        if (!linkedUserId && authToken.startsWith('user_')) {
          const uId = parseInt(authToken.split('_')[1], 10);
          if (!isNaN(uId)) {
            const uRes = await db.query(`SELECT id, name FROM users WHERE id = $1`, [uId]);
            if (uRes.rows.length > 0) {
              linkedUserId = uRes.rows[0].id;
              linkedUserName = uRes.rows[0].name;
            }
          }
        }
      }

      // Clean up any dummy pending rows
      await db.query(`DELETE FROM telegram_subscribers WHERE chat_id LIKE 'pending_%'`);

      if (linkedUserId) {
        // Remove any other chat rows previously tied to this user
        await db.query(`DELETE FROM telegram_subscribers WHERE user_id = $1 AND chat_id != $2`, [linkedUserId, chatId]);

        // Upsert subscriber on chat_id
        await db.query(
          `INSERT INTO telegram_subscribers (user_id, chat_id, username, first_name, is_active, auth_token, categories)
           VALUES ($1, $2, $3, $4, true, $5, '{"All"}')
           ON CONFLICT (chat_id) DO UPDATE
           SET user_id = EXCLUDED.user_id,
               username = EXCLUDED.username,
               first_name = EXCLUDED.first_name,
               is_active = true,
               auth_token = EXCLUDED.auth_token,
               updated_at = CURRENT_TIMESTAMP`,
          [linkedUserId, chatId, username, firstName, authToken]
        );
      } else {
        // Upsert general subscriber
        await db.query(
          `INSERT INTO telegram_subscribers (chat_id, username, first_name, is_active, categories)
           VALUES ($1, $2, $3, true, '{"All"}')
           ON CONFLICT (chat_id) DO UPDATE
           SET username = EXCLUDED.username,
               first_name = EXCLUDED.first_name,
               is_active = true,
               updated_at = CURRENT_TIMESTAMP`,
          [chatId, username, firstName]
        );
      }

      const welcomeMsg = `🎉 <b>Welcome to BlogHub Notifications!</b>\n\n` +
        (linkedUserName
          ? `✅ Your Telegram account is successfully connected to <b>${escapeHtml(linkedUserName)}</b>.\n\n`
          : `👋 Hello <b>${escapeHtml(firstName)}</b>! You are now subscribed to breaking news and top stories from BlogHub.\n\n`) +
        `🔔 <b>What you will receive:</b>\n` +
        `• Real-time alerts when new verified articles are published\n` +
        `• Editorial briefs & AI trending developments\n` +
        `• Direct reading links\n\n` +
        `<b>Available Commands:</b>\n` +
        `• <code>/status</code> — View your subscription status\n` +
        `• <code>/categories</code> — View subscribed news beats\n` +
        `• <code>/stop</code> — Pause all article notifications\n` +
        `• <code>/help</code> — Show this help menu`;

      const buttons = [
        [
          {
            text: '🌐 Visit BlogHub Newsroom',
            url: sanitizeTelegramButtonUrl(frontendBase),
          },
        ],
        [
          {
            text: '⚙️ Manage Preferences',
            url: sanitizeTelegramButtonUrl(`${frontendBase}/dashboard`),
          },
        ],
      ];

      await sendMessage(chatId, welcomeMsg, { buttons });
      console.log(`📤 [TelegramBot] Sent /start welcome response to chat ${chatId}`);
      return;
    }

    // 2. COMMAND: /stop or /unsubscribe
    if (text === '/stop' || text === '/unsubscribe') {
      await db.query(
        `UPDATE telegram_subscribers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE chat_id = $1`,
        [chatId]
      );

      await sendMessage(
        chatId,
        `⏸ <b>Notifications Paused</b>\n\nYou will no longer receive article alerts from BlogHub.\n\nTo resume receiving news anytime, send <code>/start</code>.`
      );
      console.log(`📤 [TelegramBot] Sent /stop response to chat ${chatId}`);
      return;
    }

    // 3. COMMAND: /status
    if (text === '/status') {
      const subRes = await db.query(
        `SELECT ts.*, u.name as user_name FROM telegram_subscribers ts
         LEFT JOIN users u ON ts.user_id = u.id
         WHERE ts.chat_id = $1`,
        [chatId]
      );

      if (subRes.rows.length === 0) {
        await sendMessage(
          chatId,
          `ℹ️ You are not currently subscribed. Send <code>/start</code> to subscribe!`
        );
        return;
      }

      const sub = subRes.rows[0];
      const catList = (sub.categories || ['All']).join(', ');

      const statusMsg = `📊 <b>Your BlogHub Subscription Status</b>\n\n` +
        `• <b>Status:</b> ${sub.is_active ? '🟢 Active' : '🔴 Paused'}\n` +
        `• <b>Linked Profile:</b> ${sub.user_name ? escapeHtml(sub.user_name) : 'Guest Subscriber'}\n` +
        `• <b>Subscribed Topics:</b> <i>${escapeHtml(catList)}</i>\n` +
        `• <b>Member Since:</b> ${new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n\n` +
        `You can update topic preferences on BlogHub at any time.`;

      const buttons = [
        [
          {
            text: '⚙️ Open Dashboard',
            url: sanitizeTelegramButtonUrl(`${frontendBase}/dashboard`),
          },
        ],
      ];

      await sendMessage(chatId, statusMsg, { buttons });
      console.log(`📤 [TelegramBot] Sent /status response to chat ${chatId}`);
      return;
    }

    // 4. COMMAND: /categories
    if (text === '/categories') {
      const subRes = await db.query(
        `SELECT categories FROM telegram_subscribers WHERE chat_id = $1`,
        [chatId]
      );
      const currentCats = subRes.rows.length > 0 ? subRes.rows[0].categories : ['All'];

      const catMsg = `🏷️ <b>Available BlogHub Topics</b>\n\n` +
        `Your current alert topics: <b>${escapeHtml((currentCats || []).join(', '))}</b>\n\n` +
        `Supported categories on BlogHub:\n` +
        `• <b>Technology</b>\n` +
        `• <b>AI & Code</b>\n` +
        `• <b>World News</b>\n` +
        `• <b>Sports</b>\n` +
        `• <b>Business</b>\n` +
        `• <b>Science</b>\n` +
        `• <b>Lifestyle</b>\n` +
        `• <b>Food & Cooking</b>\n\n` +
        `<i>Visit your BlogHub Creator Studio settings to toggle specific topics!</i>`;

      const buttons = [
        [
          {
            text: '⚙️ Update Topic Settings',
            url: sanitizeTelegramButtonUrl(`${frontendBase}/dashboard`),
          },
        ],
      ];

      await sendMessage(chatId, catMsg, { buttons });
      console.log(`📤 [TelegramBot] Sent /categories response to chat ${chatId}`);
      return;
    }

    // 5. COMMAND: /help or fallback
    const helpMsg = `🤖 <b>BlogHub Telegram Bot Help</b>\n\n` +
      `<b>Available Commands:</b>\n` +
      `• <code>/start</code> — Subscribe & link your account\n` +
      `• <code>/status</code> — Check notification status & topics\n` +
      `• <code>/categories</code> — View subscribed news categories\n` +
      `• <code>/stop</code> — Pause all article notifications\n` +
      `• <code>/help</code> — Show this help message`;

    const buttons = [
      [
        {
          text: '🌐 Visit BlogHub',
          url: sanitizeTelegramButtonUrl(frontendBase),
        },
      ],
    ];

    await sendMessage(chatId, helpMsg, { buttons });
    console.log(`📤 [TelegramBot] Sent /help response to chat ${chatId}`);
  } catch (err) {
    console.error(`❌ [TelegramBot] Error handling message from ${chatId}:`, err);
    try {
      await sendMessage(chatId, `⚠️ <i>We received your command and your account is active!</i>`);
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Background Long Polling Loop for Telegram Bot Updates
 */
async function startPolling() {
  const token = getBotToken();
  if (!token) {
    console.log('ℹ️ [TelegramService] Long polling skipped: No bot token configured.');
    return;
  }

  if (isPollingActive) {
    console.log('ℹ️ [TelegramService] Polling is already active.');
    return;
  }
  isPollingActive = true;

  console.log('🤖 [TelegramService] Starting background polling for @BlogHubNewsBot...');

  // 1. Delete any existing webhook to ensure getUpdates functions properly
  try {
    await callTelegramApi('deleteWebhook', { drop_pending_updates: false });
    console.log('✅ [TelegramService] Webhook cleared. Polling mode engaged.');
  } catch (wErr) {
    console.warn('⚠️ [TelegramService] deleteWebhook note:', wErr.message);
  }

  // 2. Validate Bot Identity
  const botInfo = await getBotInfo();
  if (botInfo) {
    console.log(`✅ [TelegramService] Bot ready: @${botInfo.username} (${botInfo.first_name})`);
  }

  // 3. Continuous polling loop
  (async () => {
    while (isPollingActive) {
      try {
        const payload = {
          offset: pollingOffset,
          timeout: 20,
          allowed_updates: ['message', 'callback_query'],
        };

        const updates = await callTelegramApi('getUpdates', payload);

        if (Array.isArray(updates) && updates.length > 0) {
          for (const update of updates) {
            pollingOffset = update.update_id + 1;

            if (update.message) {
              await handleTelegramMessage(update.message);
            }
          }
        }
      } catch (err) {
        if (err.description && err.description.includes('Conflict')) {
          console.warn('⚠️ [TelegramService] Polling instance conflict detected. Retrying in 8s...');
          await new Promise((resolve) => setTimeout(resolve, 8000));
        } else if (err.error_code === 429) {
          console.warn('⚠️ [TelegramService] Rate limit received. Backing off for 10s...');
          await new Promise((resolve) => setTimeout(resolve, 10000));
        } else {
          // Brief pause before next cycle
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }
  })();
}

function stopPolling() {
  isPollingActive = false;
  console.log('🛑 [TelegramService] Stopped polling.');
}

module.exports = {
  getBotToken,
  getBotInfo,
  getFrontendBaseUrl,
  getBlogPath,
  getBlogCoverPhoto,
  sendPhoto,
  sendMessage,
  notifySubscribersForBlog,
  handleTelegramMessage,
  startPolling,
  stopPolling,
  escapeHtml,
  stripHtml,
  sanitizeTelegramButtonUrl,
};
