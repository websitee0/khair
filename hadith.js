(function () {
    const hadithListEl = document.getElementById('hadithList');
    const contentEl = document.getElementById('content');
    const titleEl = document.getElementById('hadithTitle');
    const metaEl = document.getElementById('hadithMeta');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    const searchInput = document.getElementById('searchInput');
    const openSidebarBtn = document.getElementById('openSidebar');

    const incBtns = [document.getElementById('increaseFont'), document.getElementById('increaseFont2')].filter(Boolean);
    const decBtns = [document.getElementById('decreaseFont'), document.getElementById('decreaseFont2')].filter(Boolean);
    const themeBtns = [document.getElementById('toggleTheme'), document.getElementById('toggleTheme2')].filter(Boolean);

    let currentFontScale = Number(localStorage.getItem('fontScale') || 1);
    let currentTheme = localStorage.getItem('theme') || 'dark';
    function applyFontScale() {
        document.documentElement.style.setProperty('--reader-scale', currentFontScale);
        contentEl && (contentEl.style.fontSize = (22 * currentFontScale) + 'px');
    }
    function applyTheme() { document.body.classList.toggle('light', currentTheme === 'light'); }
    applyFontScale();
    applyTheme();

    incBtns.forEach(btn => btn.addEventListener('click', () => {
        currentFontScale = Math.min(2, +(currentFontScale + 0.1).toFixed(2));
        localStorage.setItem('fontScale', String(currentFontScale));
        applyFontScale();
    }));
    decBtns.forEach(btn => btn.addEventListener('click', () => {
        currentFontScale = Math.max(0.7, +(currentFontScale - 0.1).toFixed(2));
        localStorage.setItem('fontScale', String(currentFontScale));
        applyFontScale();
    }));
    themeBtns.forEach(btn => btn.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    }));

    // Mobile sidebar toggle (same behavior as Quran page)
    if (openSidebarBtn && sidebar && backdrop) {
        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            backdrop.hidden = false;
        });
        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('open');
            backdrop.hidden = true;
        });
    }

    // Fallback small set (used if JSON fails to load)
    const fallbackHadiths = [
        { id: 'niyyah', text: 'إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى...', source: 'صحيح البخاري', number: '1', grade: 'صحيح' },
        { id: 'deen-naseehah', text: 'الدين النصيحة. قلنا: لمن؟ قال: لله، ولكتابه، ولرسوله، ولأئمة المسلمين وعامتهم.', source: 'صحيح مسلم', number: '55', grade: 'صحيح' },
        { id: 'halal-bayin', text: 'الحلال بين والحرام بين وبينهما أمور مشتبهات...', source: 'صحيح البخاري', number: '52', grade: 'صحيح' },
        { id: 'love-for-brother', text: 'لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه.', source: 'صحيح البخاري', number: '13', grade: 'صحيح' },
        { id: 'islam-safety', text: 'المسلم من سلم المسلمون من لسانه ويده.', source: 'صحيح البخاري', number: '10', grade: 'صحيح' },
        { id: 'iman-neighbor', text: 'من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت، ومن كان يؤمن بالله واليوم الآخر فليكرم جاره، ومن كان يؤمن بالله واليوم الآخر فليكرم ضيفه.', source: 'صحيح البخاري', number: '6018', grade: 'صحيح' },
        { id: 'la-taghdab', text: 'أن رجلًا قال للنبي صلى الله عليه وسلم: أوصني. قال: لا تغضب. فردد مرارًا، قال: لا تغضب.', source: 'صحيح البخاري', number: '6116', grade: 'صحيح' },
        { id: 'tahur-shatr', text: 'الطهور شطر الإيمان، والحمد لله تملأ الميزان...', source: 'صحيح مسلم', number: '223', grade: 'صحيح' },
        { id: 'bardain', text: 'من صلى البردين دخل الجنة.', source: 'صحيح البخاري', number: '574', grade: 'صحيح' },
        { id: 'dal-ala-khair', text: 'من دل على خير فله مثل أجر فاعله.', source: 'صحيح مسلم', number: '1893', grade: 'صحيح' },
        { id: 'seek-knowledge', text: 'من سلك طريقًا يلتمس فيه علمًا سهَّل الله له به طريقًا إلى الجنة.', source: 'صحيح مسلم', number: '2699', grade: 'صحيح' },
        { id: 'closest-in-sujud', text: 'أقرب ما يكون العبد من ربه وهو ساجد فأكثروا الدعاء.', source: 'صحيح مسلم', number: '482', grade: 'صحيح' },
        { id: 'help-brother', text: 'والله في عون العبد ما كان العبد في عون أخيه.', source: 'صحيح مسلم', number: '2699', grade: 'صحيح' },
        { id: 'cover-muslim', text: 'من ستر مسلمًا ستره الله في الدنيا والآخرة.', source: 'صحيح مسلم', number: '—', grade: 'صحيح' },
        { id: 'remove-harm', text: 'تميط الأذى عن الطريق صدقة.', source: 'صحيح البخاري', number: '2989', grade: 'صحيح' },
        { id: 'smile-sadaqah', text: 'تبسمك في وجه أخيك لك صدقة.', source: 'صحيح مسلم', number: '—', grade: 'صحيح' },
        { id: 'follow-bad-with-good', text: 'اتق الله حيثما كنت... وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن.', source: 'صحيح', number: '—', grade: 'صحيح' },
        { id: 'moderation', text: 'إن الدين يسر، ولن يشاد الدين أحد إلا غلبه، فسددوا وقاربوا وأبشروا...', source: 'صحيح البخاري', number: '39', grade: 'صحيح' },
        { id: 'istiqamah', text: 'قل آمنت بالله ثم استقم.', source: 'صحيح مسلم', number: '—', grade: 'صحيح' },
        { id: 'road-rights', text: 'إياكم والجلوس في الطرقات... فأعطوا الطريق حقه: غض البصر، وكف الأذى، ورد السلام، والأمر بالمعروف والنهي عن المنكر.', source: 'صحيح البخاري', number: '2465', grade: 'صحيح' }
    ];

    let allHadiths = [];
    let visibleCount = 0;
    const PAGE_SIZE = 30;
    let loadMoreBtn = null;

    function ensureLoadMoreButton() {
        if (loadMoreBtn) return loadMoreBtn;
        loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'control';
        loadMoreBtn.type = 'button';
        loadMoreBtn.style.margin = '10px';
        loadMoreBtn.textContent = 'عرض المزيد';
        loadMoreBtn.addEventListener('click', () => {
            visibleCount = Math.min(allHadiths.length, visibleCount + PAGE_SIZE);
            renderList();
        });
        return loadMoreBtn;
    }

    function renderList(itemsOverride) {
        hadithListEl.innerHTML = '';
        const frag = document.createDocumentFragment();
        const items = itemsOverride || allHadiths.slice(0, visibleCount);
        items.forEach((h, idx) => {
            const btn = document.createElement('button');
            btn.className = 'surah-item';
            btn.type = 'button';
            btn.setAttribute('data-id', h.id);
            const order = itemsOverride ? idx + 1 : idx + 1; // display index within current view
            btn.innerHTML = `<span>${order}</span><span>${truncate(h.text, 36)}</span>`;
            btn.addEventListener('click', () => {
                renderHadith(h);
                if (sidebar && backdrop) {
                    sidebar.classList.remove('open');
                    backdrop.hidden = true;
                }
            });
            frag.appendChild(btn);
        });
        hadithListEl.appendChild(frag);

        // Load more visibility
        if (!itemsOverride && allHadiths.length > visibleCount) {
            hadithListEl.appendChild(ensureLoadMoreButton());
            loadMoreBtn.style.display = '';
        } else if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }

    function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

    function renderHadith(h) {
        titleEl.textContent = 'أحاديث صحيحة';
        metaEl.textContent = `${h.source} • رقم ${h.number} • ${h.grade}`;
        contentEl.innerHTML = '';
        const wrap = document.createElement('article');
        wrap.className = 'hadith-item';
        const p = document.createElement('p');
        p.className = 'ayah';
        p.textContent = h.text;
        const m = document.createElement('div');
        m.className = 'hadith-meta';
        m.textContent = metaEl.textContent;
        wrap.appendChild(p);
        wrap.appendChild(m);
        contentEl.appendChild(wrap);
        contentEl.scrollTop = 0;
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim();
            if (!q) {
                renderList();
                return;
            }
            const filtered = allHadiths.filter(h => (h.text + ' ' + h.source).includes(q));
            renderList(filtered);
        });
    }

    async function loadHadiths() {
        try {
            const res = await fetch('hadith-data.json', { cache: 'no-store' });
            if (!res.ok) throw new Error('not found');
            const json = await res.json();
            const arr = Array.isArray(json) ? json : (json.data || []);
            // normalize minimal fields
            allHadiths = arr.map((h, i) => ({
                id: h.id || `h-${i + 1}`,
                text: h.text,
                source: h.source || 'صحيح',
                number: h.number || '—',
                grade: h.grade || 'صحيح'
            })).filter(h => h && h.text);
            if (allHadiths.length === 0) throw new Error('empty');
        } catch (_) {
            allHadiths = fallbackHadiths;
        }
        visibleCount = Math.min(PAGE_SIZE, allHadiths.length);
        renderList();
        if (allHadiths.length) renderHadith(allHadiths[0]);
    }

    loadHadiths();
})();


