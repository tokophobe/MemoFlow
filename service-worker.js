const CACHE_NAME = "memoflow-v1";


const filesToCache = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


// Installation

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(CACHE_NAME)
            .then(cache =>
                cache.addAll(filesToCache)
            )

        );

    }
);



// Utilisation du cache

self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches.match(event.request)
            .then(response => {

                return response ||
                    fetch(event.request);

            })

        );

    }
);