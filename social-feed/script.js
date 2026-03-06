const connectedPlatforms = new Set(JSON.parse(localStorage.getItem('social_connected')) || []);

const mockPosts = [
    { platform: 'linkedin', author: 'Jane Smith', tag: '@janesmith', time: '2h', content: 'Excited to announce I am starting a new position as Senior Engineer! 🚀 #career #tech', likes: 142, comments: 23 },
    { platform: 'xtwitter', author: 'Tech News', tag: '@technews', time: '5m', content: 'Breaking: New JavaScript framework released. Developers are excited (and tired).', likes: 890, comments: 120 },
    { platform: 'xtwitter', author: 'Elon Musk', tag: '@elonmusk', time: '1h', content: 'To the moon! 🚀', likes: 14000, comments: 2000 },
    { platform: 'facebook', author: 'John Doe', tag: 'Friends', time: '4h', content: 'Beautiful hike today at the national park!', hasImage: true, likes: 45, comments: 4 },
    { platform: 'instagram', author: 'Travel Photos', tag: 'Sponsored', time: '1d', content: 'Experience the magic of the mountains. Book your next trip today. 🌄', hasImage: true, likes: 2340, comments: 56 },
    { platform: 'linkedin', author: 'Tech Corp', tag: 'Company', time: '1d', content: 'We are hiring! Check out our open roles in engineering and product.', likes: 304, comments: 45 },
    { platform: 'facebook', author: 'Local News', tag: 'Public', time: '30m', content: 'City council approves new park funding in unanimous vote.', likes: 112, comments: 30 }
];

document.addEventListener('DOMContentLoaded', () => {
    initSettingsView();

    document.getElementById('btn-settings').addEventListener('click', () => {
        document.getElementById('view-feed').classList.add('hidden');
        document.getElementById('view-settings').classList.remove('hidden');
        initSettingsView();
    });

    document.getElementById('btn-view-feed').addEventListener('click', () => {
        document.getElementById('view-settings').classList.add('hidden');
        document.getElementById('view-feed').classList.remove('hidden');
        renderFeed();
    });

    // Auto-open feed if already connected
    if (connectedPlatforms.size > 0) {
        document.getElementById('view-settings').classList.add('hidden');
        document.getElementById('view-feed').classList.remove('hidden');
        renderFeed();
    }
});

function initSettingsView() {
    document.querySelectorAll('.social-item').forEach(item => {
        const platform = item.dataset.platform;
        const isConnected = connectedPlatforms.has(platform);
        const statusSpan = item.querySelector('.status');
        const btn = item.querySelector('.btn-connect');

        if (isConnected) {
            item.classList.add('is-connected');
            statusSpan.textContent = 'Connected';
            statusSpan.className = 'status connected';
            btn.textContent = 'Disconnect';
        } else {
            item.classList.remove('is-connected');
            statusSpan.textContent = 'Disconnected';
            statusSpan.className = 'status disconnected';
            btn.textContent = 'Connect';
        }

        btn.onclick = () => toggleConnection(platform);
    });
}

function toggleConnection(platform) {
    if (connectedPlatforms.has(platform)) {
        connectedPlatforms.delete(platform);
    } else {
        // Simulate OAuth
        connectedPlatforms.add(platform);
    }
    localStorage.setItem('social_connected', JSON.stringify(Array.from(connectedPlatforms)));
    initSettingsView();
}

function renderFeed() {
    const container = document.getElementById('feed-container');
    container.innerHTML = '';

    if (connectedPlatforms.size === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash" style="font-size: 40px; margin-bottom: 15px; color: #475569;"></i>
                <h3>No Accounts Connected</h3>
                <p>Connect your social media accounts in settings to aggregate your feed.</p>
                <button class="btn-primary mt-4" onclick="document.getElementById('btn-settings').click()">Go to Settings</button>
            </div>
        `;
        return;
    }

    const filteredPosts = mockPosts.filter(p => connectedPlatforms.has(p.platform));
    
    // Sort random-ish but deterministic (for mock)
    filteredPosts.sort(() => 0.5 - Math.random());

    if (filteredPosts.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>No recent posts found.</h3></div>`;
        return;
    }

    filteredPosts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'feed-item';
        
        let iconClass = '';
        if (post.platform === 'linkedin') iconClass = 'fab fa-linkedin platform-linkedin';
        if (post.platform === 'xtwitter') iconClass = 'fab fa-x-twitter platform-xtwitter';
        if (post.platform === 'facebook') iconClass = 'fab fa-facebook platform-facebook';
        if (post.platform === 'instagram') iconClass = 'fab fa-instagram platform-instagram';

        const imageHtml = post.hasImage ? `<div class="feed-image"><i class="fas fa-image" style="font-size:30px;"></i></div>` : '';

        item.innerHTML = `
            <div class="feed-header">
                <div class="feed-author">
                    <div class="author-avatar">${post.author.charAt(0)}</div>
                    <div class="author-info">
                        <h4>${post.author}</h4>
                        <span>${post.tag} • ${post.time}</span>
                    </div>
                </div>
                <div class="feed-platform-icon">
                    <i class="${iconClass}"></i>
                </div>
            </div>
            <div class="feed-content">${post.content}</div>
            ${imageHtml}
            <div class="feed-actions">
                <button><i class="far fa-heart"></i> ${post.likes}</button>
                <button><i class="far fa-comment"></i> ${post.comments}</button>
                <button><i class="fas fa-share"></i> Share</button>
            </div>
        `;
        container.appendChild(item);
    });
}
