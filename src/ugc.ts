import { chromium } from "playwright";
import { fetchMovieTrailer, searchMovies } from "./tmdb";

export type Theater = { name: string; href: string };

export async function getTheaters(): Promise<Theater[]> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("https://www.ugc.fr/cinemas.html");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  const theaters = await page.$$eval('a[href^="cinema-"]', (anchors) =>
    anchors
      .map((a) => ({
        href: a.getAttribute("href") ?? "",
        name: a.getAttribute("title") ?? "",
      }))
      .filter((a) => a.href && a.name)
  );

  await browser.close();
  return theaters;
}

export async function getTodaySessions(pageRoute: `${string}.html`) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`https://www.ugc.fr/${pageRoute}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  const sessions = await page.$$eval("button[data-showing]", (buttons) => {
    return buttons
      .map((button) => {
        const film = button.getAttribute("data-film") ?? "";
        const hour = button.getAttribute("data-seancehour") ?? undefined;
        const cinema = button.getAttribute("data-cinema") ?? undefined;
        const date = button.getAttribute("data-seancedate") ?? undefined;
        const hourEnd = button
          .querySelector(".screening-end")
          ?.textContent?.trim();
        const lang = button
          .querySelector(".screening-lang")
          ?.textContent?.trim();
        const room = button
          .querySelector(".screening-detail")
          ?.textContent?.trim();

        return {
          film,
          hour,
          hourEnd,
          cinema: cinema,
          date,
          lang,
          room,
        };
      })
      .filter((b) => b.film);
  });
  const sessionsByFilm = sessions.reduce((acc, session) => {
    const { film, ...rest } = session;
    return { ...acc, [film]: [...(acc[session.film] ?? []), rest] };
  }, {} as Record<string, Omit<(typeof sessions)[number], "film">[]>);

  await browser.close();
  return sessionsByFilm;
}

async function main() {
  //   console.log(await getTheaters());
  const sessions = await getTodaySessions("cinema-ugc-cine-cite-bercy.html");
  for (const film of Object.keys(sessions)) {
    const movie = await searchMovies(film, 1);
    const trailer =
      movie.length > 0
        ? (await fetchMovieTrailer(movie[0].id)) ?? "No trailer"
        : "No trailer";
    console.log(
      `\n${movie[0].title ? movie[0].title : film} ${
        trailer.startsWith("https") ? `\x1b[34m${trailer}\x1b[0m` : trailer
      }`
    );
    for (const session of sessions[film]) {
      console.log(
        `  \x1b[30m${session.hour} ${session.hourEnd} - ${session.lang} - ${session.room}\x1b[0m`
      );
    }
  }
}

if (require.main === module) {
  main();
}
