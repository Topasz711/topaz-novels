// State Management
const state = {
    novels: [],
    currentNovel: null,
    currentChapter: null,
    view: 'home', // home, detail, reader
    sortBy: 'popular' // popular, latest
};

// DOM Elements
const appContent = document.getElementById('app-content');
const btnHome = document.getElementById('btn-home');
const filterContainer = document.getElementById('filter-container');
const filterBtns = document.querySelectorAll('.filter-btn');

// --- Initialization ---
async function init() {
    try {
        const response = await fetch('novels/manifest.json');
        state.novels = await response.json();
        renderHome();
    } catch (error) {
        console.error("Failed to load novels:", error);
        appContent.innerHTML = `<div class="text-red-400 text-center p-10">Error loading database. Please try again.</div>`;
    }
}

// --- Navigation Logic ---
btnHome.addEventListener('click', () => {
    state.view = 'home';
    state.currentNovel = null;
    state.currentChapter = null;
    renderHome();
});

// Filter Logic
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => {
            b.classList.remove('bg-white/10', 'text-white', 'border-white/20');
            b.classList.add('bg-transparent', 'text-white/60', 'border-transparent');
        });
        e.target.classList.remove('bg-transparent', 'text-white/60', 'border-transparent');
        e.target.classList.add('bg-white/10', 'text-white', 'border-white/20');
        state.sortBy = e.target.dataset.filter;
        renderHome();
    });
});

// --- Rendering Functions ---

// 1. Render Home (Grid)
function renderHome() {
    filterContainer.classList.remove('hidden');
    
    let displayNovels = [...state.novels];
    
    // เรียงลำดับตามข้อมูล JSON ไปก่อน
    if (state.sortBy === 'popular') {
        displayNovels.sort((a, b) => b.viewCount - a.viewCount);
    } else {
        displayNovels.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
    }

    // เริ่มสร้าง Grid
    let html = `<div class="novel-grid">`;
    
    // สร้าง HTML ทันทีโดยไม่ต้องรอ fetch
    html += displayNovels.map(novel => {
        return `
        <div class="glass-card flex flex-col h-full group" onclick="loadNovelDetail('${novel.id}')">
            <div class="h-48 w-full overflow-hidden relative">
                <img src="${novel.cover}" alt="${novel.title}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100">
                ${novel.isEnded ? '<span class="absolute top-2 right-2 bg-green-500/80 text-white text-[10px] px-2 py-1 rounded font-bold uppercase backdrop-blur-sm">Completed</span>' : ''}
            </div>
            
            <div class="p-4 flex flex-col flex-1">
                <h3 class="text-lg font-bold text-white mb-1 group-hover:text-medical transition">${novel.title}</h3>
                <div class="flex justify-between items-center text-xs text-white/40 mb-3 font-mono">
                    <span><i class="fa-solid fa-pen-nib mr-1"></i> ${novel.author}</span>
                    <span><i class="fa-solid fa-eye mr-1"></i> <span id="view-count-${novel.id}">...</span></span>
                </div>
                <div class="mt-auto pt-3 border-t border-white/5 flex justify-between items-center">
                    <span class="text-xs text-white/50">${novel.totalChapters} Episodes</span>
                    <span class="text-xs text-medical font-bold opacity-0 group-hover:opacity-100 transition-opacity">READ NOW <i class="fa-solid fa-arrow-right ml-1"></i></span>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    html += `</div>`;
    appContent.innerHTML = html;

    // Fetch ยอดวิวแบบ Background Process
    displayNovels.forEach(async (novel) => {
        const counterID = `topaz_novel_${novel.id}_main`;
        try {
            const res = await fetch(`https://api.countapi.xyz/info/topaz-novels-test/${counterID}`);
            if (res.ok) {
                const data = await res.json();
                const el = document.getElementById(`view-count-${novel.id}`);
                if (el) el.innerText = data.value.toLocaleString();
            }
        } catch (e) {
            // ถ้าโหลดไม่ได้ ให้แสดง 0 หรือค่าเดิม
            const el = document.getElementById(`view-count-${novel.id}`);
            if (el && el.innerText === '...') el.innerText = '0';
        }
    });
}

// 2. Render Novel Detail
async function loadNovelDetail(id) {
    appContent.innerHTML = `<div class="flex justify-center items-center h-full"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-medical"></i></div>`;
    
    try {
        const response = await fetch(`novels/${id}.json`);
        const novel = await response.json();
        
        state.currentNovel = novel;
        state.view = 'detail';
        filterContainer.classList.add('hidden');

        let html = `
            <div class="flex flex-col md:flex-row gap-8 animate-fade-in">
                <div class="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                    <div class="glass-card p-2 rounded-xl">
                        <img src="${novel.cover}" class="w-full rounded-lg shadow-2xl">
                    </div>
                    <div class="mt-4 text-center">
                        <div id="detail-view-count" class="text-3xl font-bold text-medical font-mono mb-1">...</div>
                        <div class="text-xs text-white/40 uppercase tracking-widest">Total Reads</div>
                    </div>
                </div>

                <div class="flex-1">
                    <h2 class="text-3xl font-bold text-white mb-2">${novel.title}</h2>
                    <div class="flex items-center gap-4 text-sm text-white/60 mb-6 font-mono">
                        <span class="bg-white/5 px-2 py-1 rounded border border-white/10"><i class="fa-solid fa-user mr-2"></i>${novel.author}</span>
                        <span><i class="fa-regular fa-clock mr-2"></i>Updated Recently</span>
                    </div>

                    <div class="glass-card p-6 mb-8 bg-black/20">
                        <h3 class="text-sm font-bold text-medical uppercase tracking-widest mb-3">Synopsis</h3>
                        <p class="text-white/80 leading-relaxed font-light">${novel.synopsis}</p>
                    </div>

                    <h3 class="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">EPISODES (${novel.chapters.length})</h3>
                    
                    <div class="space-y-3">
                        ${novel.chapters.map((chap, index) => `
                            <div onclick="loadReader(${index})" class="glass-card p-4 flex justify-between items-center group cursor-pointer hover:bg-white/5">
                                <div class="flex items-center gap-4">
                                    <span class="text-2xl font-mono text-white/20 font-bold group-hover:text-medical transition">#${chap.chapter_number}</span>
                                    <div>
                                        <div class="font-bold text-white group-hover:text-medical transition">${chap.title}</div>
                                        <div class="text-xs text-white/40 mt-1">Click to read</div> 
                                    </div>
                                </div>
                                <button class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-medical group-hover:text-black transition">
                                    <i class="fa-solid fa-play text-xs"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        appContent.innerHTML = html;
        window.scrollTo(0, 0);

        // Fetch ยอดวิวแบบ Background
        const counterID = `topaz_novel_${novel.id}_main`;
        try {
            const countRes = await fetch(`https://api.countapi.xyz/info/topaz-novels-test/${counterID}`);
            if (countRes.ok) {
                const countData = await countRes.json();
                const el = document.getElementById('detail-view-count');
                if (el) el.innerText = (countData.value || 0).toLocaleString();
            }
        } catch (e) {
            console.log("Counter lookup failed");
            const el = document.getElementById('detail-view-count');
            if (el) el.innerText = '0';
        }

    } catch (error) {
        console.error("Error loading novel:", error);
    }
}

// 3. Render Reader
async function loadReader(chapterIndex) {
    const novel = state.currentNovel;
    const chapter = novel.chapters[chapterIndex];
    state.currentChapter = chapterIndex;
    state.view = 'reader';

    const formattedContent = chapter.content
        .split('\n') // ตัดแบ่งข้อความเมื่อเจอ \n
        .filter(para => para.trim() !== '') // กรองบรรทัดเปล่าทิ้ง
        .map(para => `<p>${para}</p>`) // ห่อด้วย tag <p>
        .join('');
        
    let html = `
        <div class="max-w-3xl mx-auto animate-fade-in">
            <div class="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                <button onclick="loadNovelDetail('${novel.id}')" class="text-sm text-white/60 hover:text-white flex items-center gap-2">
                    <i class="fa-solid fa-arrow-left"></i> Back to Menu
                </button>
                <div class="text-xs font-mono text-medical">READING: ${novel.title}</div>
            </div>

            <div class="mb-12">
                <h1 class="text-2xl md:text-3xl font-bold text-white mb-2 text-center">${chapter.title}</h1>
                <div class="text-center text-xs text-white/40 font-mono mb-10">
                    <i class="fa-solid fa-eye mr-2"></i> <span id="chapter-view-count">...</span> Reads
                </div>
                
                <div class="reader-content text-lg text-white/90 font-light leading-loose">
                    ${formattedContent}
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                <button 
                    onclick="${chapterIndex > 0 ? `loadReader(${chapterIndex - 1})` : ''}" 
                    class="glass-card p-4 text-center ${chapterIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}"
                    ${chapterIndex === 0 ? 'disabled' : ''}
                >
                    <div class="text-xs text-white/40 mb-1">PREVIOUS</div>
                    <div class="font-bold">Previous Episode</div>
                </button>
                
                <button 
                    onclick="${chapterIndex < novel.chapters.length - 1 ? `loadReader(${chapterIndex + 1})` : `loadNovelDetail('${novel.id}')`}" 
                    class="glass-card p-4 text-center bg-medical/10 border-medical/30 hover:bg-medical/20"
                >
                    <div class="text-xs text-medical mb-1">NEXT</div>
                    <div class="font-bold text-white">${chapterIndex < novel.chapters.length - 1 ? 'Next Episode' : 'Finish & Return'}</div>
                </button>
            </div>
        </div>
    `;

    appContent.innerHTML = html;
    window.scrollTo(0, 0);

    // Count view in background
    const counterID = `topaz_novel_${novel.id}_chap_${chapter.chapter_number}`;
    try {
        const res = await fetch(`https://api.countapi.xyz/hit/topaz-novels-test/${counterID}`);
        const data = await res.json();
        const el = document.getElementById('chapter-view-count');
        if (el) el.innerText = data.value.toLocaleString();
        console.log("View counted:", data.value);
    } catch (e) {
        console.log("Counter error", e);
        const el = document.getElementById('chapter-view-count');
        if (el) el.innerText = (chapter.views || 0).toLocaleString();
    }
}

// Start App
init();
