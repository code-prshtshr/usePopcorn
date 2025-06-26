import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useMovie } from "./useMovie";
import { useLocalStorage } from "./useLocalStorage";
import { useKey } from "./useKey";

// Inline styles for component visuals
const styles = `
  .box {
    background: #23272f;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 2rem;
    box-sizing: border-box;
  }
  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 350px;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .list::-webkit-scrollbar {
    display: none;
  }
  .list li img {
    width: 50px;
    height: 75px;
    object-fit: cover;
  }
  .list li h3 {
    margin: 0;
    font-size: 1rem;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .list li div {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .list li p {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .error {
    padding: 0.75rem;
    border-radius: 5px;
    margin-top: 1rem;
  }
  .loader {
    color: #fff;
    font-weight: bold;
    padding: 0.5rem 0;
  }
`;

// Utility function to calculate average
const average = (arr) =>
  arr.length ? arr.reduce((acc, cur) => acc + cur, 0) / arr.length : 0;

// API key
const KEY = "bcd56b42";

// Main App component
export default function App() {
  const [query, setQuery] = useState("");
  const [selectedID, setSelectedID] = useState(null);
  const { movies, isLoading, error } = useMovie(query);
  const [watched, setWatched] = useLocalStorage([], "watched");

  function handleSelectedID(id) {
    setSelectedID(id);
  }

  function handleCloseID() {
    setSelectedID(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeletedWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  return (
    <>
      <style>{styles}</style>

      <NavBar>
        <Logo />
        <SearchBar query={query} setQuery={setQuery} />
        <NumberResult movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {isLoading && <Loading />}
          {error && <Error message={error} />}
          {!isLoading && !error && movies.length > 0 && (
            <DisplayMovieList
              movies={movies}
              onSelectedMovie={handleSelectedID}
            />
          )}
          {!isLoading && !error && movies.length === 0 && query.length >= 2 && (
            <Error message="No movies found." />
          )}
        </Box>

        <Box>
          {selectedID ? (
            <SelectedMovie
              selectedID={selectedID}
              onCloseID={handleCloseID}
              handleAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMovieList
                watched={watched}
                onDeleteWatched={handleDeletedWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

// Reusable Components
function NavBar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function SearchBar({ query, setQuery }) {
  const inputElement = useRef(null);

  useKey("Enter", function () {
    inputElement.current.focus();
    setQuery("");
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputElement}
    />
  );
}

function NumberResult({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function Error({ message }) {
  return (
    <p className="error">
      <span>⛔</span> {message}
    </p>
  );
}

function Loading() {
  return <p className="loader">Loading...</p>;
}

function DisplayMovieList({ movies, onSelectedMovie }) {
  return (
    <ul className="list list-movies">
      {movies.map((movie) => (
        <MovieItem
          key={movie.imdbID}
          movie={movie}
          onSelectedMovie={onSelectedMovie}
        />
      ))}
    </ul>
  );
}

function MovieItem({ movie, onSelectedMovie }) {
  return (
    <li onClick={() => onSelectedMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>📅</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function SelectedMovie({ selectedID, onCloseID, handleAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState(null);

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedID);
  const watchedUserrating = watched.find(
    (movie) => movie.imdbID === selectedID
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Plot: plot,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovieDetails() {
      try {
        setLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedID}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setMovie(data);
        setLoading(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err.message);
        }
      }
    }
    fetchMovieDetails();

    return () => controller.abort();
  }, [selectedID]);

  useEffect(() => {
    if (!title) return;
    document.title = `Movie:- ${title}`;

    return function () {
      document.title = `usePopcorn`;
    };
  }, [title]);

  function handleMovie() {
    const runtimeMin = Number(runtime?.split(" ")[0]) || 0;
    const newWatchedMovie = {
      imdbID: selectedID,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      userRating: Number(userRating),
      runtime: runtimeMin,
    };
    handleAddWatched(newWatchedMovie);
    onCloseID();
  }

  useKey("Escape", onCloseID);

  return (
    <div className="details">
      {loading ? (
        <Loading />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseID}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${title}`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>🌟</span>
                {imdbRating} IMDB Rating
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleMovie}>
                      + Add to List
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You have rated this movie: {watchedUserrating} <span>⭐</span>
                </p>
              )}
            </div>

            <p>
              <em>{plot}</em>
            </p>
            <p>Starring: {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgImdb = average(watched.map((m) => m.imdbRating)).toFixed(1);
  const avgUser = average(watched.map((m) => m.userRating)).toFixed(1);
  const avgRuntime = Math.round(average(watched.map((m) => m.runtime)));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span> {watched.length} movies
        </p>
        <p>
          <span>⭐️</span> {Number(avgImdb).toFixed(2)}
        </p>
        <p>
          <span>🌟</span> {Number(avgUser).toFixed(2)}
        </p>
        <p>
          <span>⏳</span> {avgRuntime} min
        </p>
      </div>
    </div>
  );
}

function WatchedMovieList({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovieItem
          key={movie.imdbID}
          movie={movie}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovieItem({ movie, onDeleteWatched }) {
  return (
    <li className="watched-movie">
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span> {movie.imdbRating}
        </p>
        <p>
          <span>🌟</span> {movie.userRating}
        </p>
        <p>
          <span>⏳</span> {movie.runtime} min
        </p>
        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}
