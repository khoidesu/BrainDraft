const API_URL = '/api';

// State Management
let clips = [];
let categories = [];

const PREDEFINED_COLORS = [
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
];

let activeCategoryId = null; // for input
let activeFilterCategoryId = null; // for filtering
let searchQuery = "";
let selectedNewCatColor = PREDEFINED_COLORS[0];

// DOM Elements
const html = document.documentElement;
const darkModeToggle = document.getElementById('dark-mode-toggle');
const darkModeIcon = document.getElementById('dark-mode-icon');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatContainer = document.getElementById('chat-container');
const tagBtn = document.getElementById('tag-btn');
const categoryDropdown = document.getElementById('category-dropdown');
const createNewCatBtn = document.getElementById('create-new-cat-btn');
const categoryList = document.getElementById('category-list');
const activeCategoryIndicator = document.getElementById('active-category-indicator');
const activeCategoryBadge = document.getElementById('active-category-badge');
const activeCategoryName = document.getElementById('active-category-name');
const clearCategoryBtn = document.getElementById('clear-category-btn');
const categoryModal = document.getElementById('category-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelCatBtn = document.getElementById('cancel-cat-btn');
const saveCatBtn = document.getElementById('save-cat-btn');
const newCatNameInput = document.getElementById('new-cat-name');
const colorPicker = document.getElementById('color-picker');
const searchInput = document.getElementById('search-input');
const filterBtn = document.getElementById('filter-btn');
const filterDropdown = document.getElementById('filter-dropdown');
const filterCategoryList = document.getElementById('filter-category-list');
const bgSettingsToggle = document.getElementById('bg-settings-toggle');
const bgSettingsModal = document.getElementById('bg-settings-modal');
const closeBgModalBtn = document.getElementById('close-bg-modal-btn');
const cancelBgBtn = document.getElementById('cancel-bg-btn');
const saveBgBtn = document.getElementById('save-bg-btn');
const clearBgBtn = document.getElementById('clear-bg-btn');
const desktopBgInput = document.getElementById('desktop-bg-input');
const mobileBgInput = document.getElementById('mobile-bg-input');
const bgBlurSlider = document.getElementById('bg-blur-slider');
const blurValueDisplay = document.getElementById('blur-value-display');
const appBackground = document.getElementById('app-background');

// --- Initialization ---
async function init() {
    initDarkMode();
    applyBackgroundSettings();
    renderColorPicker();
    setupEventListeners();

    try {
        const [catsRes, clipsRes] = await Promise.all([
            fetch(`${API_URL}/categories`),
            fetch(`${API_URL}/clips`)
        ]);

        if (catsRes.ok) categories = await catsRes.json();
        if (clipsRes.ok) clips = await clipsRes.json();
    } catch (err) {
        console.error('Error fetching data:', err);
    }

    renderCategories();
    renderClips();

    // Scroll to bottom
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}

// --- Event Listeners ---
function setupEventListeners() {
    // Dark mode
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Auto-resize textarea
    chatInput.addEventListener('input', function () {
        this.style.height = '56px';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });

    // Send Message
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Tag Dropdown
    tagBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        categoryDropdown.classList.toggle('hidden');
        filterDropdown.classList.add('hidden');
    });

    // Filter Dropdown
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.classList.toggle('hidden');
        categoryDropdown.classList.add('hidden');
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!categoryDropdown.contains(e.target) && !tagBtn.contains(e.target)) {
            categoryDropdown.classList.add('hidden');
        }
        if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target)) {
            filterDropdown.classList.add('hidden');
        }
    });

    // Active Category clearing
    clearCategoryBtn.addEventListener('click', () => {
        activeCategoryId = null;
        updateActiveCategoryUI();
    });

    // Modal
    createNewCatBtn.addEventListener('click', () => {
        categoryDropdown.classList.add('hidden');
        categoryModal.classList.remove('hidden');
        newCatNameInput.value = '';
        selectedNewCatColor = PREDEFINED_COLORS[0];
        renderColorPicker();
        newCatNameInput.focus();
    });

    const closeModal = () => categoryModal.classList.add('hidden');
    closeModalBtn.addEventListener('click', closeModal);
    cancelCatBtn.addEventListener('click', closeModal);

    saveCatBtn.addEventListener('click', async () => {
        const name = newCatNameInput.value.trim();
        if (name) {
            const newCat = {
                id: 'cat-' + Date.now(),
                name: name,
                color: selectedNewCatColor
            };

            try {
                const res = await fetch(`${API_URL}/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCat)
                });
                if (res.ok) {
                    const savedCat = await res.json();
                    categories.push(savedCat);
                    renderCategories();
                    activeCategoryId = savedCat.id;
                    updateActiveCategoryUI();
                    closeModal();
                }
            } catch (err) {
                console.error('Error creating category:', err);
            }
        }
    });

    // Background Settings
    bgSettingsToggle.addEventListener('click', () => {
        bgSettingsModal.classList.remove('hidden');
        desktopBgInput.value = localStorage.getItem('clipbox_desktop_bg') || '';
        mobileBgInput.value = localStorage.getItem('clipbox_mobile_bg') || '';
        const blurVal = localStorage.getItem('clipbox_bg_blur') || '0';
        bgBlurSlider.value = blurVal;
        blurValueDisplay.textContent = blurVal + 'px';
    });

    const closeBgModal = () => bgSettingsModal.classList.add('hidden');
    closeBgModalBtn.addEventListener('click', closeBgModal);
    cancelBgBtn.addEventListener('click', closeBgModal);

    bgBlurSlider.addEventListener('input', (e) => {
        blurValueDisplay.textContent = e.target.value + 'px';
    });

    clearBgBtn.addEventListener('click', () => {
        localStorage.removeItem('clipbox_desktop_bg');
        localStorage.removeItem('clipbox_mobile_bg');
        localStorage.removeItem('clipbox_bg_blur');
        applyBackgroundSettings();
        closeBgModal();
    });

    saveBgBtn.addEventListener('click', () => {
        localStorage.setItem('clipbox_desktop_bg', desktopBgInput.value.trim());
        localStorage.setItem('clipbox_mobile_bg', mobileBgInput.value.trim());
        localStorage.setItem('clipbox_bg_blur', bgBlurSlider.value);
        applyBackgroundSettings();
        closeBgModal();
    });

    window.addEventListener('resize', () => {
        // Debounce slightly for performance
        clearTimeout(window.resizeBgTimer);
        window.resizeBgTimer = setTimeout(applyBackgroundSettings, 100);
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderClips();
    });
}

// --- Dark Mode ---
function initDarkMode() {
    const isDark = localStorage.getItem('clipbox_theme') === 'dark' ||
        (!('clipbox_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
        html.classList.add('dark');
        html.classList.remove('light');
        darkModeIcon.textContent = 'light_mode';
    } else {
        html.classList.remove('dark');
        html.classList.add('light');
        darkModeIcon.textContent = 'dark_mode';
    }
}

function toggleDarkMode() {
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        html.classList.add('light');
        localStorage.setItem('clipbox_theme', 'light');
        darkModeIcon.textContent = 'dark_mode';
    } else {
        html.classList.add('dark');
        html.classList.remove('light');
        localStorage.setItem('clipbox_theme', 'dark');
        darkModeIcon.textContent = 'light_mode';
    }
}

// --- Background Settings ---
function applyBackgroundSettings() {
    const desktopBg = localStorage.getItem('clipbox_desktop_bg');
    const mobileBg = localStorage.getItem('clipbox_mobile_bg');
    const blurVal = localStorage.getItem('clipbox_bg_blur') || '0';

    const isMobile = window.innerWidth < 768; // Tailwind md breakpoint
    const bgUrl = isMobile ? (mobileBg || desktopBg) : (desktopBg || mobileBg);

    if (bgUrl) {
        appBackground.style.backgroundImage = `url("${bgUrl}")`;
        // Use scale(1.1) to hide blurry edges
        appBackground.style.filter = blurVal > 0 ? `blur(${blurVal}px)` : 'none';
        appBackground.style.transform = blurVal > 0 ? 'scale(1.1)' : 'none';
    } else {
        appBackground.style.backgroundImage = 'none';
        appBackground.style.filter = 'none';
        appBackground.style.transform = 'none';
    }
}

// --- Data Management ---
async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    let type = 'text';
    if (text.startsWith('http://') || text.startsWith('https://')) type = 'link';
    else if (text.includes('{') || text.includes(';') || text.split('\n').length > 2) type = 'code';

    const newClip = {
        id: 'clip-' + Date.now(),
        content: text,
        type: type,
        categoryId: activeCategoryId,
        createdAt: new Date().toISOString()
    };

    try {
        const res = await fetch(`${API_URL}/clips`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClip)
        });
        if (res.ok) {
            const savedClip = await res.json();
            clips.push(savedClip);
            chatInput.value = '';
            chatInput.style.height = '56px';
            renderClips();
            setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);
        }
    } catch (err) {
        console.error('Error saving clip:', err);
    }
}

// --- Rendering ---
function renderColorPicker() {
    colorPicker.innerHTML = PREDEFINED_COLORS.map(color => `
        <button class="w-8 h-8 rounded-full ${color.split(' ')[0]} border-2 ${selectedNewCatColor === color ? 'border-primary' : 'border-transparent'} transition-all"
                onclick="selectColor('${color}')" type="button"></button>
    `).join('');
}

window.selectColor = function (color) {
    selectedNewCatColor = color;
    renderColorPicker();
}

function renderCategories() {
    // For Tag Dropdown
    categoryList.innerHTML = categories.map(cat => `
        <button class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                onclick="selectCategory('${cat.id}')">
            <span class="w-3 h-3 rounded-full ${cat.color.split(' ')[0]}"></span>
            ${cat.name}
        </button>
    `).join('');

    // For Filter Dropdown
    filterCategoryList.innerHTML = `
        <button class="w-full text-left px-4 py-2 text-sm ${activeFilterCategoryId === null ? 'bg-primary/10 text-primary dark:text-primary-dark font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
                onclick="setFilterCategory(null)">
            All Categories
        </button>
        ${categories.map(cat => `
            <button class="w-full text-left px-4 py-2 text-sm flex items-center justify-between ${activeFilterCategoryId === cat.id ? 'bg-primary/10 text-primary dark:text-primary-dark font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
                    onclick="setFilterCategory('${cat.id}')">
                <span class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full ${cat.color.split(' ')[0]}"></span>
                    ${cat.name}
                </span>
                ${activeFilterCategoryId === cat.id ? '<span class="material-symbols-outlined text-[16px]">check</span>' : ''}
            </button>
        `).join('')}
    `;
}

window.selectCategory = function (id) {
    activeCategoryId = id;
    updateActiveCategoryUI();
    categoryDropdown.classList.add('hidden');
}

window.setFilterCategory = function (id) {
    activeFilterCategoryId = id;
    renderCategories(); // update active state in dropdown
    renderClips();
    filterDropdown.classList.add('hidden');

    if (id) {
        filterBtn.classList.add('text-primary', 'dark:text-primary-dark');
        filterBtn.classList.remove('text-gray-600', 'dark:text-gray-400');
    } else {
        filterBtn.classList.remove('text-primary', 'dark:text-primary-dark');
        filterBtn.classList.add('text-gray-600', 'dark:text-gray-400');
    }
}

function updateActiveCategoryUI() {
    if (activeCategoryId) {
        const cat = categories.find(c => c.id === activeCategoryId);
        if (cat) {
            activeCategoryIndicator.classList.remove('hidden');
            activeCategoryBadge.className = `text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm ${cat.color}`;
            activeCategoryName.textContent = cat.name;
        }
    } else {
        activeCategoryIndicator.classList.add('hidden');
    }
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 1) return `${diffDay}d ago`;
    if (diffDay === 1) return `Yesterday`;
    if (diffHr > 0) return `${diffHr}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return `Just now`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Optional: show a toast
    });
}

window.deleteClip = async function (id) {
    try {
        const res = await fetch(`${API_URL}/clips/${id}`, { method: 'DELETE' });
        if (res.ok) {
            clips = clips.filter(c => c.id !== id);
            renderClips();
        }
    } catch (err) {
        console.error('Error deleting clip:', err);
    }
}

let longPressTimer;
window.handleTouchStart = function (e, content, element) {
    longPressTimer = setTimeout(() => {
        navigator.clipboard.writeText(content).then(() => {
            if (window.navigator.vibrate) {
                window.navigator.vibrate(50); // Haptic feedback on copy
            }
            const toast = element.querySelector('.copy-toast');
            if (toast) {
                toast.classList.remove('opacity-0');
                setTimeout(() => {
                    toast.classList.add('opacity-0');
                }, 2000);
            }
        });
    }, 500); // 500ms long press
}

window.handleTouchEnd = function () {
    clearTimeout(longPressTimer);
}

window.handleTouchMove = function () {
    clearTimeout(longPressTimer);
}

function renderClips() {
    chatContainer.innerHTML = '';

    let filteredClips = clips;

    if (activeFilterCategoryId) {
        filteredClips = filteredClips.filter(c => c.categoryId === activeFilterCategoryId);
    }

    if (searchQuery) {
        filteredClips = filteredClips.filter(c => c.content.toLowerCase().includes(searchQuery));
    }

    if (filteredClips.length === 0) {
        chatContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-2">
                <span class="material-symbols-outlined text-4xl">inbox</span>
                <p>No clips found</p>
            </div>
        `;
        return;
    }

    let lastDateLabel = null;

    filteredClips.forEach(clip => {
        const timeLabel = formatRelativeTime(clip.createdAt);
        let dateLabel = 'Today';
        if (timeLabel.includes('d ago') || timeLabel === 'Yesterday') {
            dateLabel = timeLabel.includes('d ago') ? new Date(clip.createdAt).toLocaleDateString() : 'Yesterday';
        }

        if (dateLabel !== lastDateLabel) {
            const divider = document.createElement('div');
            divider.className = 'flex justify-center my-2 mt-4';
            divider.innerHTML = `<span class="text-[12px] text-gray-500 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">${dateLabel}</span>`;
            chatContainer.appendChild(divider);
            lastDateLabel = dateLabel;
        }

        const cat = categories.find(c => c.id === clip.categoryId);
        let contentHtml = '';

        if (clip.type === 'link') {
            contentHtml = `<a class="text-primary hover:underline break-all" href="${clip.content}" target="_blank">${clip.content}</a>`;
        } else if (clip.type === 'code') {
            contentHtml = `<pre class="text-[13px] font-code overflow-x-auto whitespace-pre-wrap"><code>${clip.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        } else {
            contentHtml = `<p class="whitespace-pre-wrap text-sm">${clip.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
        }

        const clipEl = document.createElement('div');
        clipEl.className = 'flex flex-col items-end w-full group';
        clipEl.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
                <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button class="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-dark p-1 rounded" onclick="navigator.clipboard.writeText(\`${clip.content.replace(/`/g, '\\`')}\`)">
                        <span class="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                    <button class="text-gray-500 hover:text-red-500 dark:text-gray-400 p-1 rounded" onclick="deleteClip('${clip.id}')">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                </div>
                ${cat ? `<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${cat.color}">${cat.name}</span>` : ''}
                <span class="text-[12px] text-gray-400 dark:text-gray-500">${timeLabel}</span>
            </div>
            <div class="message-bubble relative bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-2xl rounded-tr-sm border border-gray-200 dark:border-gray-700/50 shadow-sm"
                 ontouchstart="handleTouchStart(event, \`${clip.content.replace(/`/g, '\\`')}\`, this)"
                 ontouchend="handleTouchEnd(event)"
                 ontouchmove="handleTouchMove(event)">
                ${contentHtml}
                <div class="copy-toast pointer-events-none absolute -bottom-6 right-0 text-[11px] text-primary dark:text-primary-dark font-semibold opacity-0 transition-opacity duration-300">Đã sao chép</div>
            </div>
        `;
        chatContainer.appendChild(clipEl);
    });
}

// Start
init();
