#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config({ quiet: true });

const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchFromTMDb(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString());
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`[${res.status}] ${body.status_message}`);
  }

  return body;
}

type Movie = {
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};
async function fetchMoviesInTheater(): Promise<Movie[]> {
  const data = await fetchFromTMDb("/movie/now_playing", {
    language: "fr-FR",
    region: "FR",
  });

  return data.results;
}

async function fetchMovieTrailer(movieId: number): Promise<string | null> {
  const data = await fetchFromTMDb(`/movie/${movieId}/videos`, {
    language: "fr-FR",
  });

  type Video = { type: string; site: string; key: string };
  const trailer = (data.results as Video[]).find(
    (vid: Video) => vid.type === "Trailer" && vid.site === "YouTube"
  );

  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

async function main() {
  try {
    const movies = await fetchMoviesInTheater();
    const maxLength = movies.reduce(
      (max, movie) => (movie.title.length > max ? movie.title.length : max),
      0
    );
    for (const movie of movies) {
      const trailerUrl = await fetchMovieTrailer(movie.id);
      if (trailerUrl) {
        console.log(
          `\x1b[33m⭐ ${movie.vote_average.toFixed(
            1
          )}\x1b[0m  ${movie.title.padEnd(
            maxLength
          )} \x1b[34m${trailerUrl}\x1b[0m`
        );
        if (process.argv.includes("-V")) {
          console.log(`\x1b[30m${movie.overview}\x1b[0m`);
        }
      }
    }
  } catch (err) {
    console.error(`❌ \x1b[31m${(err as Error).message}\x1b[0m`);
  }
}

main();
