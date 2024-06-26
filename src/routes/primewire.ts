import { MovieMedia, ShowMedia } from "@movie-web/providers";
import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { fetchHlsLinks, fetchMovieData, fetchTVData } from "../utils/functions";

const routes = async (fastify: FastifyInstance) => {
    fastify.get("/", (_, rp) => {
        rp.status(200).send({
            intro: "Welcome to the primewire provider",
            routes: "/watch-movie " + "/watch-tv",
        });
    });

    // media from TMDB

    fastify.get(
        "/watch-movie",
        async (request: FastifyRequest, reply: FastifyReply) => {
            const tmdbId = (request.query as { tmdbId: string }).tmdbId;
            const proxied = (request.query as { proxied: string }).proxied;
            const server = (request.query as { server: string }).server;

            let releaseYear: string = "";
            let title: string = "";

            if (typeof tmdbId === "undefined")
                return reply
                    .status(400)
                    .send({ message: "tmdb id is required" });

            try {
                await fetchMovieData(tmdbId).then((data) => {
                    if (data) {
                        releaseYear = data?.year.toString();
                        title = data?.title;
                    }
                });

                const media: MovieMedia = {
                    type: "movie",
                    title: title,
                    releaseYear: parseInt(releaseYear),
                    tmdbId: tmdbId,
                };

                await fetchHlsLinks(proxied, reply, media, "primewire", server);
            } catch (error) {
                reply.status(500).send({
                    message: "Something went wrong. Please try again",
                    error: error,
                });
            }
        },
    );

    fastify.get(
        "/watch-tv",
        async (request: FastifyRequest, reply: FastifyReply) => {
            const tmdbId = (request.query as { tmdbId: string }).tmdbId;
            const episode = (request.query as { episode: string }).episode;
            const season = (request.query as { season: string }).season;
            const proxied = (request.query as { proxied: string }).proxied;
            const server = (request.query as { server: string }).server;

            let title: string = "";
            let episodeId: string = "";
            let seasonId: string = "";
            let releaseYear: string = "";
            let numberOfSeasons: string = "";

            if (typeof tmdbId === "undefined")
                return reply
                    .status(400)
                    .send({ message: "tmdb id is required" });
            if (typeof episode === "undefined")
                return reply
                    .status(400)
                    .send({ message: "episode is required" });
            if (typeof season === "undefined")
                return reply.status(400).send({
                    message: "season is required",
                });

            try {
                await fetchTVData(tmdbId, season, episode).then((data) => {
                    if (data) {
                        title = data?.title;
                        episodeId = data?.episodeId.toString();
                        seasonId = data?.seasonId.toString();
                        releaseYear = data?.year.toString();
                        numberOfSeasons = data?.numberOfSeasons.toString();
                    }
                });

                const media: ShowMedia = {
                    type: "show",
                    title: title,
                    episode: {
                        number: parseInt(episode),
                        tmdbId: episodeId,
                    },
                    season: {
                        number: parseInt(season),
                        tmdbId: seasonId,
                    },
                    releaseYear: parseInt(releaseYear),
                    tmdbId: tmdbId,
                };

                await fetchHlsLinks(proxied, reply, media, "primewire", server);
            } catch (error) {
                reply.status(500).send({
                    message: "Something went wrong. Please try again",
                    error: error,
                });
            }
        },
    );
};

export default routes;
