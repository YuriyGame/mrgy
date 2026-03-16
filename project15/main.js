class CinemaApp {
    constructor(movies) {
        this.movies = movies;
        this.state = {
            search: '',
            genre: 'Все',
            watchlist: JSON.parse(localStorage.getItem('cinema_gold_list')) || [],
            userRatings: JSON.parse(localStorage.getItem('cinema_user_ratings')) || {},
            watchlistMode: false
        };
        this.init();
    }

    init() {
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.renderGenres();
        this.renderMovies();
        this.setupBackgroundEffects();
    }

    renderGenres() {
        const genres = ['Все', ...new Set(this.movies.map(m => m.genre))];
        const container = document.getElementById('genreFilters');
        if (!container) return;
        container.innerHTML = genres.map(g => `
            <button onclick="app.setGenre('${g}')" 
                class="px-8 py-3 rounded-full font-bold transition-all ${this.state.genre === g ? 'bg-indigo-600 text-white shadow-xl' : 'glass-panel opacity-50 hover:opacity-100 text-'}">
                ${g}
            </button>
        `).join('');
    }

    renderMovies() {
        const container = document.getElementById('movieContainer');
        const filtered = this.movies.filter(m => {
            const matchSearch = m.title.toLowerCase().includes(this.state.search.toLowerCase());
            const matchGenre = this.state.genre === 'Все' || m.genre === this.state.genre;
            const matchWatchlist = !this.state.watchlistMode || this.state.watchlist.includes(m.id);
            return matchSearch && matchGenre && matchWatchlist;
        });

        container.innerHTML = filtered.map((m, i) => {
            const isInWatchlist = this.state.watchlist.includes(m.id);
            const userRating = this.state.userRatings[m.id];
            return `
            <div class="movie-card">
                <div class="relative h-[550px] rounded-[3rem] overflow-hidden group shadow-lg bg-black">
                    <button onclick="event.stopPropagation(); app.toggleWatchItem(${m.id})" 
                        class="watchlist-btn ${isInWatchlist ? 'active' : ''}">
                        <svg class="w-6 h-6" fill="${isInWatchlist ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                    </button>
                    <div class="w-full h-full cursor-pointer" onclick="app.openModal(${m.id})">
                        <img src="${m.img}" class="w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-110">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                        <div class="absolute bottom-10 left-10 right-10 text-white text-left">
                            <span class="text-indigo-400 text-[10px] font-black tracking-widest uppercase">${m.genre}</span>
                            <h3 class="text-4xl font-black leading-tight mb-2 tracking-tighter">${m.title}</h3>
                            <div class="flex items-center gap-2 text-amber-400 font-bold">★ ${m.rating} ${userRating ? `<span class="bg-amber-500 text-black text-[9px] px-2 py-0.5 rounded ml-2">МОЯ: ${userRating}</span>` : ''}</div>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
        document.getElementById('watchlistCount').innerText = this.state.watchlist.length;
    }

    openModal(id) {
        const m = this.movies.find(x => x.id === id);
        const currentRating = this.state.userRatings[id] || 0;
        let stars = '';
        for(let i=5; i>=1; i--) stars += `<input type="radio" id="st${i}" name="rt" value="${i}" ${currentRating == i ? 'checked' : ''} onclick="app.setRating(${id}, ${i})"><label for="st${i}">★</label>`;

        document.getElementById('modalContent').innerHTML = `
            <div class="flex flex-col lg:flex-row bg-[var(--bg-dark)] text-">
                <div class="lg:w-1/2 h-[450px] lg:h-auto"><img src="${m.img}" class="w-full h-full object-cover"></div>
                <div class="lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center">
                    <h2 class="text-6xl font-black mb-6 hero-title leading-tight">${m.title}</h2>
                    
                    <div class="flex items-center justify-between gap-6 mb-10 glass-panel p-4 rounded-3xl">
                        <div class="flex items-center gap-4">
                            <span class="text-[10px] font-black opacity-50 uppercase tracking-widest">Оценка:</span>
                            <div class="star-rating">${stars}</div>
                        </div>
                        ${currentRating > 0 ? `<button onclick="app.removeRating(${id})" class="text-[10px] font-bold opacity-40 hover:opacity-100 hover:text-red-500 transition-all">✕ СБРОСИТЬ</button>` : ''}
                    </div>

                    <p class="opacity-80 text-xl leading-relaxed mb-12 italic" style="white-space: pre-line">${m.longDesc}</p>
                    
                    <button onclick="app.toggleWatchItem(${m.id})" 
                        class="w-full py-6 rounded-2xl font-black tracking-widest transition-all flex items-center justify-center text-center ${this.state.watchlist.includes(m.id) ? 'bg-red-500/20 text-red-500' : 'bg-indigo-600 text-white shadow-2xl'}">
                        ${this.state.watchlist.includes(m.id) ? 'УДАЛИТЬ ИЗ СПИСКА' : 'В МОЙ СПИСОК'}
                    </button>
                </div>
            </div>`;
        document.getElementById('fullModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    removeRating(id) {
        delete this.state.userRatings[id];
        localStorage.setItem('cinema_user_ratings', JSON.stringify(this.state.userRatings));
        this.renderMovies();
        this.openModal(id);
    }

    setRating(id, val) {
        this.state.userRatings[id] = val;
        localStorage.setItem('cinema_user_ratings', JSON.stringify(this.state.userRatings));
        this.renderMovies();
        this.openModal(id);
    }

    // Вспомогательные функции
    closeModal() { document.getElementById('fullModal').classList.add('hidden'); document.body.style.overflow = 'auto'; }
    setGenre(g) { this.state.genre = g; this.renderGenres(); this.renderMovies(); }
    handleSearch(val) { this.state.search = val; this.renderMovies(); }
    toggleWatchlistMode() { this.state.watchlistMode = !this.state.watchlistMode; this.renderMovies(); }
    toggleTheme() {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.renderGenres();
        this.renderMovies();
    }

    toggleWatchItem(id) {
        const idx = this.state.watchlist.indexOf(id);
        if (idx > -1) this.state.watchlist.splice(idx, 1);
        else this.state.watchlist.push(id);
        localStorage.setItem('cinema_gold_list', JSON.stringify(this.state.watchlist));
        this.renderMovies();
        if (!document.getElementById('fullModal').classList.contains('hidden')) this.openModal(id);
    }

    setupBackgroundEffects() {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX - window.innerWidth / 2) * 0.02;
            const y = (e.clientY - window.innerHeight / 2) * 0.02;
            document.getElementById('blob-1').style.transform = `translate(${x}px, ${y}px)`;
            document.getElementById('blob-2').style.transform = `translate(${-x}px, ${-y}px)`;
        });
    }

    reset() {
        this.state.search = '';
        this.state.genre = 'Все';
        this.state.watchlistMode = false;
        document.getElementById('mainSearch').value = '';
        this.renderGenres();
        this.renderMovies();
    }
}

const app = new CinemaApp(MOVIES);
