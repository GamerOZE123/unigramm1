import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const postId = url.searchParams.get("id");

  if (!postId) {
    return new Response("Missing post id", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, content, image_url, image_urls, user_id, created_at")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return new Response("Post not found", { status: 404, headers: corsHeaders });
  }

  // Fetch author profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("user_id", post.user_id)
    .single();

  const authorName = profile?.full_name || profile?.username || "Someone";
  const contentPreview = post.content
    ? post.content.substring(0, 100) + (post.content.length > 100 ? "..." : "")
    : "Check out this post on Unigramm";
  const postImage =
    post.image_url ||
    (post.image_urls && post.image_urls.length > 0 ? post.image_urls[0] : null);
  const ogImage = postImage || "https://unigramm1.lovable.app/favicon.ico";
  const siteUrl = "https://unigramm1.lovable.app";
  const postUrl = `${siteUrl}/post/${post.id}`;
  const deepLink = `unigramm://post/${post.id}`;

  const safeAuthor = escapeHtml(authorName);
  const safeContent = escapeHtml(contentPreview);
  const safeOgImage = escapeHtml(ogImage);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${safeAuthor} on Unigramm</title>

  <!-- Open Graph -->
  <meta property="og:title" content="${safeAuthor} on Unigramm"/>
  <meta property="og:description" content="${safeContent}"/>
  <meta property="og:image" content="${safeOgImage}"/>
  <meta property="og:url" content="${escapeHtml(postUrl)}"/>
  <meta property="og:site_name" content="Unigramm"/>
  <meta property="og:type" content="article"/>

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${safeAuthor} on Unigramm"/>
  <meta name="twitter:description" content="${safeContent}"/>
  <meta name="twitter:image" content="${safeOgImage}"/>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #080c17;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 420px;
      width: 100%;
      padding: 24px;
      text-align: center;
    }
    .post-image {
      width: 100%;
      max-height: 360px;
      object-fit: cover;
      border-radius: 16px;
      margin-bottom: 20px;
    }
    .author {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #fff;
    }
    .caption {
      font-size: 14px;
      color: #9ca3af;
      margin-bottom: 28px;
      line-height: 1.5;
    }
    .spinner-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 32px;
      transition: opacity 0.4s;
    }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid rgba(79,142,255,0.3);
      border-top-color: #4f8eff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner-text { font-size: 14px; color: #9ca3af; }
    .buttons { display: none; flex-direction: column; gap: 12px; }
    .btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 15px; font-weight: 600;
      text-decoration: none;
      transition: transform 0.15s, opacity 0.15s;
    }
    .btn:active { transform: scale(0.97); }
    .btn-apple { background: #fff; color: #000; }
    .btn-google { background: #1a1a2e; color: #fff; border: 1px solid rgba(255,255,255,0.15); }
    .btn-web { background: transparent; color: #4f8eff; font-size: 13px; margin-top: 4px; }
    .logo-mark {
      width: 48px; height: 48px; border-radius: 12px;
      margin: 0 auto 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="${safeOgImage}" alt="" class="logo-mark" id="logo" style="display:none"/>
    ${postImage ? `<img src="${escapeHtml(postImage)}" alt="Post" class="post-image" id="postImg"/>` : ""}
    <div class="author">${safeAuthor}</div>
    <div class="caption">${safeContent}</div>

    <div class="spinner-wrap" id="spinnerWrap">
      <div class="spinner"></div>
      <span class="spinner-text">Opening Unigramm…</span>
    </div>

    <div class="buttons" id="buttons">
      <a class="btn btn-apple" href="https://apps.apple.com/us/app/unigramm/id6759472658">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        Download on App Store
      </a>
      <a class="btn btn-google" href="https://play.google.com/store/apps/details?id=com.nike11.UnigrammApp">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3DDC84"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.403l2.937 1.706a1 1 0 010 1.735l-2.938 1.706L15.27 12l2.428-2.696zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z"/></svg>
        Get it on Google Play
      </a>
      <a class="btn btn-web" href="${escapeHtml(postUrl)}">Open in browser →</a>
    </div>
  </div>

  <script>
    (function() {
      var deepLink = "${deepLink}";
      var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      var isAndroid = /Android/i.test(navigator.userAgent);
      var isMobile = isIOS || isAndroid;

      // Try deep link
      if (isMobile) {
        var iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = deepLink;
        document.body.appendChild(iframe);
        window.location.href = deepLink;
      }

      setTimeout(function() {
        var spinner = document.getElementById('spinnerWrap');
        var buttons = document.getElementById('buttons');
        spinner.style.opacity = '0';
        setTimeout(function() {
          spinner.style.display = 'none';
          buttons.style.display = 'flex';
          if (isIOS) {
            window.location.href = 'https://apps.apple.com/us/app/unigramm/id6759472658';
          } else if (isAndroid) {
            window.location.href = 'https://play.google.com/store/apps/details?id=com.nike11.UnigrammApp';
          }
        }, 400);
      }, 1500);
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
