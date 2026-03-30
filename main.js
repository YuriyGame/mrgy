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
    const savedTheme =
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

    document.documentElement.setAttribute('data-theme', savedTheme);

    this.renderGenres();
    this.renderMovies();
    this.setupBackgroundEffects();
    this.setupModalCloseHandlers();
  }

  renderGenres() {
    const genres = ['Все', ...new Set(this.movies.map(m => m.genre))];
    const container = document.getElementById('genreFilters');
    if (!container) return;

    container.innerHTML = genres
      .map(
        g => `
          <button
            onclick="app.setGenre('${g}')"
            class="px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full font-bold transition-all text-sm sm:text-base ${
              this.state.genre === g
                ? 'bg-indigo-600 text-white shadow-xl'
                : 'glass-panel opacity-80 hover:opacity-100'
            }"
          >
            ${g}
          </button>
        `
      )
      .join('');
  }

  renderMovies() {
    const container = document.getElementById('movieContainer');
    if (!container) return;

    const filtered = this.movies.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(this.state.search.toLowerCase());
      const matchGenre = this.state.genre === 'Все' || m.genre === this.state.genre;
      const matchWatchlist = !this.state.watchlistMode || this.state.watchlist.includes(m.id);
      return matchSearch && matchGenre && matchWatchlist;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full glass-panel rounded-[2rem] p-8 sm:p-12 text-center">
          <h3 class="text-2xl sm:text-3xl font-black mb-3 hero-title">Ничего не найдено</h3>
          <p class="soft-text text-base sm:text-lg">Попробуй изменить поиск или выбрать другой жанр</p>
        </div>
      `;
      document.getElementById('watchlistCount').innerText = this.state.watchlist.length;
      return;
    }

    container.innerHTML = filtered
      .map(m => {
        const isInWatchlist = this.state.watchlist.includes(m.id);
        const userRating = this.state.userRatings[m.id];

        return `
          <div class="movie-card w-full max-w-full">
            <div class="relative h-[420px] sm:h-[480px] md:h-[520px] lg:h-[550px] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden group shadow-lg bg-black glass-panel">
              
              <button
                onclick="event.stopPropagation(); app.toggleWatchItem(${m.id})"
                class="watchlist-btn ${isInWatchlist ? 'active' : ''}"
                title="Добавить в список"
              >
                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="${isInWatchlist ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                </svg>
              </button>

              <div class="w-full h-full cursor-pointer" onclick="app.openModal(${m.id})">
                <img
                  src="${m.img}"
                  alt="${m.title}"
                  class="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                />

                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                <div class="absolute bottom-5 sm:bottom-8 left-5 sm:left-8 right-5 sm:right-8 text-white text-left">
                  <span class="text-indigo-400 text-[10px] sm:text-xs font-black tracking-[0.25em] uppercase block mb-2">
                    ${m.genre}
                  </span>

                  <h3 class="text-xl sm:text-3xl md:text-4xl font-black leading-tight mb-2 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    ${m.title}
                  </h3>

                  <div class="flex flex-wrap items-center gap-2 text-amber-400 font-bold text-sm sm:text-base">
                    <span>★ ${m.rating}</span>
                    ${
                      userRating
                        ? `
                          <span class="bg-amber-500 text-black text-[10px] sm:text-[11px] px-2 py-1 rounded-full">
                            МОЯ: ${userRating}
                          </span>
                        `
                        : ''
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    document.getElementById('watchlistCount').innerText = this.state.watchlist.length;
  }

  openModal(id) {
    const m = this.movies.find(x => x.id === id);
    if (!m) return;

    const currentRating = this.state.userRatings[id] || 0;
    let stars = '';

    for (let i = 5; i >= 1; i--) {
      stars += `
        <input
          type="radio"
          id="st${i}"
          name="rt"
          value="${i}"
          ${currentRating == i ? 'checked' : ''}
          onclick="app.setRating(${id}, ${i})"
        >
        <label for="st${i}">★</label>
      `;
    }

    document.getElementById('modalContent').innerHTML = `
      <div class="modal-layout">
        <div class="modal-poster-wrap">
          <div class="modal-poster-frame">
            <img src="${m.img}" alt="${m.title}">
          </div>
        </div>

        <div class="modal-info">
          <h2 class="modal-title">${m.title}</h2>

          <div class="modal-rating-box glass-panel">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span class="text-[10px] sm:text-xs font-black opacity-60 uppercase tracking-[0.25em]">Оценка:</span>
                <div class="star-rating">${stars}</div>
              </div>

              ${
                currentRating > 0
                  ? `
                    <button
                      onclick="app.removeRating(${id})"
                      class="text-[10px] sm:text-xs font-bold opacity-60 hover:opacity-100 hover:text-red-500 transition-all text-left sm:text-right"
                    >
                      ✕ СБРОСИТЬ
                    </button>
                  `
                  : ''
              }
            </div>
          </div>

          <p class="modal-description" style="white-space: pre-line;">${m.longDesc}</p>

          <button
            onclick="app.toggleWatchItem(${m.id})"
            class="w-full py-4 sm:py-5 rounded-2xl font-black tracking-[0.2em] transition-all flex items-center justify-center text-center text-sm sm:text-base ${
              this.state.watchlist.includes(m.id)
                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                : 'bg-indigo-600 text-white shadow-2xl'
            }"
          >
            ${this.state.watchlist.includes(m.id) ? 'УДАЛИТЬ ИЗ СПИСКА' : 'В МОЙ СПИСОК'}
          </button>
        </div>
      </div>
    `;

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

  closeModal() {
    document.getElementById('fullModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  setGenre(g) {
    this.state.genre = g;
    this.renderGenres();
    this.renderMovies();
  }

  handleSearch(val) {
    this.state.search = val;
    this.renderMovies();
  }

  toggleWatchlistMode() {
    this.state.watchlistMode = !this.state.watchlistMode;
    this.renderMovies();
  }

  toggleTheme() {
    const theme =
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    this.renderGenres();
    this.renderMovies();
  }

  toggleWatchItem(id) {
    const idx = this.state.watchlist.indexOf(id);

    if (idx > -1) {
      this.state.watchlist.splice(idx, 1);
    } else {
      this.state.watchlist.push(id);
    }

    localStorage.setItem('cinema_gold_list', JSON.stringify(this.state.watchlist));
    this.renderMovies();

    const modal = document.getElementById('fullModal');
    if (!modal.classList.contains('hidden')) {
      this.openModal(id);
    }
  }

  setupBackgroundEffects() {
    if (window.innerWidth <= 768) return;

    document.addEventListener('mousemove', (e) => {
      const blob1 = document.getElementById('blob-1');
      const blob2 = document.getElementById('blob-2');

      if (!blob1 || !blob2) return;

      const x = (e.clientX - window.innerWidth / 2) * 0.02;
      const y = (e.clientY - window.innerHeight / 2) * 0.02;

      blob1.style.transform = `translate(${x}px, ${y}px)`;
      blob2.style.transform = `translate(${-x}px, ${-y}px)`;
    });
  }

  setupModalCloseHandlers() {
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('fullModal');
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        this.closeModal();
      }
    });
  }

  reset() {
    this.state.search = '';
    this.state.genre = 'Все';
    this.state.watchlistMode = false;

    const searchInput = document.getElementById('mainSearch');
    if (searchInput) searchInput.value = '';

    this.renderGenres();
    this.renderMovies();
  }
}

const app = new CinemaApp(MOVIES);
