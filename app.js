(function () {
    const API_BASE = 'https://api.alquran.cloud/v1';
    const surahListEl = document.getElementById('surahList');
    const ayahsEl = document.getElementById('ayahs');
    const surahTitleEl = document.getElementById('surahTitle');
    const surahMetaEl = document.getElementById('surahMeta');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    const openSidebarBtn = document.getElementById('openSidebar');

    const incBtns = [document.getElementById('increaseFont'), document.getElementById('increaseFont2')].filter(Boolean);
    const decBtns = [document.getElementById('decreaseFont'), document.getElementById('decreaseFont2')].filter(Boolean);
    const themeBtns = [document.getElementById('toggleTheme'), document.getElementById('toggleTheme2')].filter(Boolean);
    const searchInput = document.getElementById('searchInput');
    const progressBar = document.getElementById('progressBar');
    const reciterSelect = document.getElementById('reciter');
    const playPauseBtn = document.getElementById('playPause');
    const prevAyahBtn = document.getElementById('prevAyah');
    const nextAyahBtn = document.getElementById('nextAyah');
    const autoScrollCk = document.getElementById('autoScroll');

    let currentFontScale = Number(localStorage.getItem('fontScale') || 1);
    let currentTheme = localStorage.getItem('theme') || 'dark';
    let currentAudio = null;
    let currentAyahIndex = -1;
    let currentAyahs = [];
    let currentSurahNumber = null;
    const audioUrlCache = new Map();
    const RECITER_SLUGS = {
        'ar.alafasy': 'ar.alafasy',
        'ar.husary': 'ar.husary',
        'ar.hudhaify': 'ar.hudhaify',
        'ar.minshawi': 'ar.minshawi',
        'ar.shaatree': 'ar.shaatree',
        'ar.mahermuaiqly': 'ar.mahermuaiqly',
    };
    const FALLBACK_RECITER = 'ar.alafasy';

    applyFontScale();
    applyTheme();

    function applyFontScale() {
        document.documentElement.style.setProperty('--reader-scale', currentFontScale);
        ayahsEl && (ayahsEl.style.fontSize = (22 * currentFontScale) + 'px');
    }

    function applyTheme() {
        document.body.classList.toggle('light', currentTheme === 'light');
    }

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

    // Reciter persistence
    if (reciterSelect) {
        const saved = localStorage.getItem('reciter') || 'ar.alafasy';
        reciterSelect.value = saved;
        reciterSelect.addEventListener('change', () => {
            localStorage.setItem('reciter', reciterSelect.value);
            // if playing, restart current ayah with new reciter
            if (currentAyahIndex >= 0) {
                playAyah(currentAyahIndex, true);
            }
        });
    }

    // Mobile sidebar toggle
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

    // Load surah list
    fetch(`${API_BASE}/surah`)
        .then(r => r.json())
        .then(data => {
            const list = data.data || [];
            renderSurahList(list);
        })
        .catch(() => {
            surahListEl.innerHTML = '<div class="surah-item">تعذر تحميل قائمة السور</div>';
        });

    function renderSurahList(items) {
        surahListEl.innerHTML = '';

        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'surah-item';
            btn.type = 'button';
            btn.setAttribute('data-number', item.number);
            btn.innerHTML = `<span>${item.number}</span><span>${item.name}</span>`;
            btn.addEventListener('click', () => {
                loadSurah(item.number, item);
                if (sidebar && backdrop) {
                    sidebar.classList.remove('open');
                    backdrop.hidden = true;
                }
            });
            fragment.appendChild(btn);
        });

        surahListEl.appendChild(fragment);

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const q = searchInput.value.trim();
                Array.from(surahListEl.children).forEach(el => {
                    const text = el.textContent || '';
                    el.style.display = text.includes(q) ? '' : 'none';
                });
            });
        }
    }

    function setActiveSurahButton(number) {
        Array.from(surahListEl.children).forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-number') === String(number));
        });
    }

    function loadSurah(number, metaFromList) {
        setActiveSurahButton(number);
        surahTitleEl.textContent = (metaFromList && metaFromList.name) || `سورة ${number}`;
        surahMetaEl.textContent = '';
        ayahsEl.innerHTML = '<div class="placeholder">...جاري التحميل</div>';

        // Using edition quran-simple for Arabic text; can switch to Uthmani if preferred
        fetch(`${API_BASE}/surah/${number}/ar.asad`)
            .then(r => r.json())
            .then(json => {
                const surah = json.data;
                surahTitleEl.textContent = surah.englishName && surah.name ? surah.name : (metaFromList?.name || surah.name);
                surahMetaEl.textContent = `${surah.englishName} • ${surah.numberOfAyahs} آية`;
                currentAyahs = surah.ayahs;
                currentSurahNumber = surah.number;
                renderAyahsWithBasmala(surah);
            })
            .catch(() => {
                ayahsEl.innerHTML = '<div class="placeholder">تعذر تحميل السورة. حاول لاحقاً.</div>';
            });
    }

    function removeDiacritics(input) {
        return (input || '')
            .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
            .replace(/\u0640/g, ''); // tatweel
    }

    function normalizeLetters(input) {
        return (input || '')
            .replace(/[\u0671\u0622\u0623\u0625]/g, 'ا') // alif variants to bare alef
            .replace(/ٱ/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/ﷲ/g, 'الله') // Allah ligature
            ;
    }

    function normalizeBasmala(text) {
        if (!text) return text;
        // Remove the dedicated basmala ligature if present
        if (/\uFDFD/.test(text)) {
            return text.replace(/\uFDFD/u, '').replace(/^\s*[ـ…\.،,:;\-–—]+/, '').trimStart();
        }
        // Work on a diacritics-free, normalized-copy to detect
        const raw = normalizeLetters(removeDiacritics(text)).replace(/\s+/g, ' ').trimStart();
        const basmalaPlain = 'بسم الله الرحمن الرحيم';
        if (raw.startsWith(basmalaPlain)) {
            // Remove from original up to the first occurrence of "الرحيم"
            const endMatch = text.match(/^([\s\S]{0,120}?)(الرحيم)/u);
            const idx = endMatch ? text.indexOf(endMatch[2]) : text.indexOf('الرحيم');
            if (idx !== -1) {
                return text.slice(idx + 'الرحيم'.length).replace(/^[\sـ…\.\-–—]+/, '').trimStart();
            }
        }
        return text;
    }

    function stripAyahEndMarkers(text) {
        if (!text) return text;
        // Remove U+06DD ARABIC END OF AYAH and any surrounding digits or brackets
        return text
            .replace(/[\u06DD﴿﴾]/g, '')
            .replace(/[\u0660-\u0669]+/g, '');
    }

    function renderAyahsWithBasmala(surah) {
        ayahsEl.innerHTML = '';
        const fragment = document.createDocumentFragment();

        if (surah.number !== 9) {
            const b = document.createElement('div');
            b.className = 'basmala';
            b.id = 'basmala';
            b.textContent = 'سمِ بالله قبل البدء';
            fragment.appendChild(b);
        }

        surah.ayahs.forEach((a, i) => {
            const p = document.createElement('p');
            p.className = 'ayah';
            p.dir = 'rtl';
            let base = a.text;
            if (surah.number !== 9) {
                if (i === 0) base = normalizeBasmala(base);
                // Some editions include basmala at start of ayah 1 and again before ayah 2 for specific surahs.
                // Remove a standalone basmala-only ayah if API ever provides it (defensive)
                const basmalaTrimmed = normalizeLetters(removeDiacritics(base)).replace(/\s+/g,'');
                if (basmalaTrimmed === 'بسماللهالرحمنالرحيم') base = '';
            }
            const safeText = stripAyahEndMarkers(base);
            p.innerHTML = `<span class=\"ayah-text\">${safeText}</span><span class=\"ayah-number\">﴿${a.numberInSurah}﴾</span>`;
            fragment.appendChild(p);
        });
        ayahsEl.appendChild(fragment);
        ayahsEl.scrollTop = 0;

        // Bind progress bar on scroll
        if (progressBar) {
            ayahsEl.addEventListener('scroll', () => {
                const max = ayahsEl.scrollHeight - ayahsEl.clientHeight;
                const pct = max > 0 ? (ayahsEl.scrollTop / max) * 100 : 0;
                progressBar.style.width = pct.toFixed(1) + '%';
            }, { passive: true });
        }
    }

    async function getAudioUrl(ayahGlobalNumber, reciterEdition) {
        const cacheKey = `${reciterEdition}:${ayahGlobalNumber}`;
        if (audioUrlCache.has(cacheKey)) return audioUrlCache.get(cacheKey);
        try {
            const res = await fetch(`${API_BASE}/ayah/${ayahGlobalNumber}/${reciterEdition}`);
            const json = await res.json();
            const url = json?.data?.audio;
            if (url) {
                audioUrlCache.set(cacheKey, url);
                return url;
            }
        } catch (_) { /* ignore */ }
        return null;
    }

    async function playAyah(index, restart = false) {
        if (!currentAyahs || index < 0 || index >= currentAyahs.length) return;

        // highlight
        const ayahNodes = ayahsEl.querySelectorAll('.ayah');
        ayahNodes.forEach(n => n.classList.remove('playing'));
        const basmalaEl = document.getElementById('basmala');
        if (index === 0 && basmalaEl && currentSurahNumber !== 9) {
            basmalaEl.classList.add('playing');
            if (autoScrollCk && autoScrollCk.checked) basmalaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const node = ayahNodes[index];
        if (node) {
            node.classList.add('playing');
            if (autoScrollCk && autoScrollCk.checked) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // stop old audio
        if (currentAudio) {
            currentAudio.pause();
            if (!restart) currentAudio.currentTime = 0;
        }

        const selected = reciterSelect ? reciterSelect.value : FALLBACK_RECITER;
        const reciter = RECITER_SLUGS[selected] || FALLBACK_RECITER;
        const ayah = currentAyahs[index];
        let url = await getAudioUrl(ayah.number, reciter);
        if (!url) {
            url = await getAudioUrl(ayah.number, FALLBACK_RECITER);
        }
        if (!url) {
            if (playPauseBtn) playPauseBtn.textContent = '▶';
            return;
        }
        currentAudio = new Audio(url);
        currentAyahIndex = index;
        if (playPauseBtn) playPauseBtn.textContent = '⏸';
        currentAudio.preload = 'auto';
        currentAudio.play().catch(() => {});

        // Preload next for smoother transition
        const next = currentAyahs[index + 1];
        if (next) {
            getAudioUrl(next.number, reciter).then((nextUrl) => {
                if (nextUrl) {
                    const pre = new Audio(nextUrl);
                    pre.preload = 'auto';
                }
            });
        }

        currentAudio.onended = () => {
            if (currentAyahIndex + 1 < currentAyahs.length) {
                playAyah(currentAyahIndex + 1);
            } else {
                if (playPauseBtn) playPauseBtn.textContent = '▶';
            }
        };
        currentAudio.onerror = () => {
            if (playPauseBtn) playPauseBtn.textContent = '▶';
        };
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (!currentAyahs || currentAyahs.length === 0) return;
            if (!currentAudio || currentAudio.paused) {
                playAyah(currentAyahIndex >= 0 ? currentAyahIndex : 0);
            } else {
                currentAudio.pause();
                playPauseBtn.textContent = '▶';
            }
        });
    }

    prevAyahBtn && prevAyahBtn.addEventListener('click', () => {
        if (!currentAyahs) return;
        const idx = currentAyahIndex > 0 ? currentAyahIndex - 1 : 0;
        playAyah(idx);
    });
    nextAyahBtn && nextAyahBtn.addEventListener('click', () => {
        if (!currentAyahs) return;
        const idx = currentAyahIndex + 1 < currentAyahs.length ? currentAyahIndex + 1 : currentAyahIndex;
        playAyah(idx);
    });
})();



