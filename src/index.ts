#!/usr/bin/env node

import { fetchMovieTrailer, searchMovies } from "./tmdb";
import { getTodaySessions } from "./ugc";

async function main() {
  try {
    const sessions = await getTodaySessions("cinema-ugc-cine-cite-bercy.html");
    for (const film of Object.keys(sessions)) {
      const movies = await searchMovies(film, 1);
      if (movies.length === 0) {
        throw new Error(`movie ${film} not found`);
      }
      const trailer = await fetchMovieTrailer(movies[0].id);
      console.log(
        `\n\x1b[33m⭐ ${movies[0].vote_average.toFixed(1)}\x1b[0m ${
          movies[0].title
        } ${
          trailer?.startsWith("https")
            ? `\x1b[34m${trailer}\x1b[0m\n`
            : "\x1b[30mno trailer\x1b[0m\n"
        }`
      );
      for (const session of sessions[film]) {
        console.log(
          `  \x1b[30m${session.hour} ${
            session.hourEnd
          } - ${session.lang?.padEnd(5)} - ${session.room}\x1b[0m`
        );
      }
    }
    console.log();
  } catch (err) {
    console.error(`❌ \x1b[31m${(err as Error).message}\x1b[0m`);
  }
}

if (require.main === module) {
  main();
}
