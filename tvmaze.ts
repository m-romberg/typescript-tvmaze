import axios from "axios";
import * as $ from 'jquery';

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");
const $episodesList = $("#episodesList");

const BASE_URL = "https://api.tvmaze.com/";
const DEFAULT_IMAGE_URL = "https://tinyurl.com/tv-missing";


interface IShowApi {
  id: number,
  name: string,
  summary: string,
  image: { medium: string; } | null;
}

interface IShow {
  id: number,
  name: string,
  summary: string,
  image: string;
}

interface IEpisode {
  id: number,
  name: string,
  season: string,
  number: string;
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function getShowsByTerm(term: string): Promise<IShow[]> {

  const results = await axios.get(`${BASE_URL}search/shows?q=${term}`);
  console.log("results", results);

  const shows: IShow[] = results.data.map((r: { show: IShowApi; }): IShow => {
    const show = r.show;
    return {
      id: show.id,
      name: show.name,
      summary: show.summary,
      image: show.image?.medium || DEFAULT_IMAGE_URL
    };
  });

  console.log("shows", shows);
  return shows;
}


/** Given list of shows, create markup for each and append to DOM */

function populateShows(shows: IShow[]): void {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src=${show.image}
              alt=${show.name}
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay(): Promise<void> {
  const term = $("#searchForm-term").val() as string;
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt: JQuery.SubmitEvent): Promise<void> {
  evt.preventDefault();
  await searchForShowAndDisplay();
});


/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id: number): Promise<IEpisode[]> {

  const results = await axios.get(`${BASE_URL}shows/${id}/episodes`);

  const episodes: IEpisode[] = results.data.map((r: IEpisode): IEpisode =>
  ({
    id: r.id,
    name: r.name,
    season: r.season,
    number: r.number
  })
  );

  return episodes;
}


/** Given an array of episodes, create markup for each and append to DOM */

function populateEpisodes(episodes: IEpisode[]): void {
  $episodesList.empty();
  console.log("populateEpisodes ran, episodes:", episodes);

  for (let episode of episodes) {
    const $episode = $(
      `<li>
        ${episode.name} (season ${episode.season}, number ${episode.number})
      </li>
    `);

    $episodesList.append($episode);
  }

  $episodesArea.show();
}


/** Get episodes of show by showId and populate episodesList in DOM */

async function getAndPopulateEpisodes(showId: number): Promise<void> {
  const episodes: IEpisode[] = await getEpisodesOfShow(showId);
  console.log("getAndPopulateEpisodes ran, episodes:", episodes);
  populateEpisodes(episodes);
}


/** After click on Episodes button, get showId and run getAndPopulateEpisodes */

async function handleClick(evt: JQuery.ClickEvent): Promise<void> {
  const showId = $(evt.target).closest(".Show").data("show-id") as string;
  console.log("handleClick ran, showId:", showId);
  await getAndPopulateEpisodes(Number(showId));
}

$("#showsList").on("click", ".Show-getEpisodes", handleClick);


