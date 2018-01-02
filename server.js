const request = require('request');
const cheerio = require('cheerio');
const express = require('express');
const app     = express();

let movies = [];
let apiKey = "19361d3f16361090c14e1f550edf9298";


app.set('view engine', 'ejs');

app.use(express.static('public'));

// start Express on port 8080
app.listen(8080, () => {
  console.log('Server Started on http://localhost:8080');
  console.log('Press CTRL + C to stop server');
});


app.get('/', (req, res) => {
  getNowPlaying(res, "");
})


app.get('/movie/:movieId', (req, res) => {
  let referer = req.headers['referer'];

  let movie = {};
  for (let i = 0; i < movies.length; i++) {
    let movieId = movies[i]["Id"];

    if (movieId == req.params.movieId) {
      movie = movies[i];
      break;
    }
  }

  let data = {
    movie: movie,
    searchTerm: "",
    referer: referer
  };

  res.render('pages/movie', data);
});


app.get('/search', (req, res) => {
  let referer = req.headers['referer'];
  let searchTerm = req.query['search_term'];

  if (searchTerm == "") {
    res.redirect(referer);
  } else if (searchTerm != "") {
    searchForMovie(res, searchTerm);
  }
});


app.get('/popular', (req, res) => {
  getPopular(res, "");
});


app.get('/top-rated', (req, res) => {
  getTopRated(res, "");
});


app.get('/upcoming', (req, res) => {
  getUpcoming(res, "");
});


function sendRequest(options) {

  return new Promise(function (resolve, reject) {

    request(options, (error, response, body) => {

      if (!error) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}


function getNowPlaying(res, title) {
  // https://api.themoviedb.org/3/movie/now_playing?api_key=<<api_key>>&language=en-US&page=1
  let options = {
    url: "https://api.themoviedb.org/3/movie/now_playing",
    method: 'GET',
    qs: {
      "api_key": apiKey,
      "language": "en-US",
      "page": 1
    },
    headers: {}
  };

  getAndDisplayMovies(res, options, title);
}


function getUpcoming(res, title) {
  // https://api.themoviedb.org/3/movie/upcoming?api_key=<<api_key>>&language=en-US&page=1
  let options = {
    url: "https://api.themoviedb.org/3/movie/upcoming",
    method: 'GET',
    qs: {
      "api_key": apiKey,
      "language": "en-US",
      "page": 1
    },
    headers: {}
  };

  getAndDisplayMovies(res, options, title);
}


function getPopular(res, title) {
  // https://api.themoviedb.org/3/movie/popular?api_key=<<api_key>>&language=en-US&page=1
  let options = {
    url: "https://api.themoviedb.org/3/movie/popular",
    method: 'GET',
    qs: {
      "api_key": apiKey,
      "language": "en-US",
      "page": 1
    },
    headers: {}
  };

  getAndDisplayMovies(res, options, title);
}


function getTopRated(res, title) {
  // https://api.themoviedb.org/3/movie/top_rated?api_key=<<api_key>>&language=en-US&page=1
  let options = {
    url: "https://api.themoviedb.org/3/movie/top_rated",
    method: 'GET',
    qs: {
      "api_key": apiKey,
      "language": "en-US",
      "page": 1
    },
    headers: {}
  };

  getAndDisplayMovies(res, options, title);
}


function searchForMovie(res, title) {
  let options = {
    url: "https://api.themoviedb.org/3/search/movie/",
    method: 'GET',
    qs: {
      "api_key": apiKey,
      "language": "en-US",
      "query": title,
      "page": 1,
      "include_adult": false
    },
    headers: {}
  };

  getAndDisplayMovies(res, options, title);
}


function getAndDisplayMovies(res, options, title) {

  sendRequest(options)
    .then((body) => {
      let parsedBody  = JSON.parse(body);
      let newMovies   = parsedBody.results;

      if (newMovies.length > 0) {
        movies = [];

        for (let i = 0; i < newMovies.length; i++) {
          movies.push(formatMovie(newMovies[i]));
        }

        let data = {
          movies: movies,
          searchTerm: title
        }

        res.render('pages/index', data);
      }
    }).catch(function (err) {
      console.error('catch', err);
    });
}


function formatMovie(movieObj) {
  let movie = {};

  let movieKeys = Object.keys(movieObj);
  for (let j = 0; j < movieKeys.length; j++) {
    let key = movieKeys[j];

    if (key == "video" ||
      key == "genre_ids" ||
      key == "backdrop_path") {
      continue;
    }

    let replacedKey = key.replace("_", " ");
    let newKey      = replacedKey.toLowerCase().replace(/(^| )(\w)/g, s => s.toUpperCase());

    if (newKey == "Adult") {
      if (movieObj[key] == false) {
        movie["Adult Content"] = "No";
      } else if (movieObj[key] == true) {
        movie["Adult Content"] = "Yes";
      }
    } else if (newKey == "Release Date") {
      movie[newKey] = dateFormatter(movieObj[key]);
    } else if (newKey == "Popularity") {
      movie[newKey] = Math.round(movieObj[key]);
    } else {
      movie[newKey] = movieObj[key];
    }
  }

  return movie;
}


function monthName(month) {
  let name = "";

  switch (month) {

    case "1":
    case "01":
      name = "January";
      break;

    case "2":
    case "02":
      name = "February";
      break;

    case "3":
    case "03":
      name = "March";
      break;

    case "4":
    case "04":
      name = "April";
      break;

    case "5":
    case "05":
      name = "May";
      break;

    case "6":
    case "06":
      name = "June";
      break;

    case "7":
    case "07":
      name = "July";
      break;

    case "8":
    case "08":
      name = "August";
      break;

    case "9":
    case "09":
      name = "September";
      break;

    case "10":
      name = "October";
      break;

    case "11":
      name = "November";
      break;

    case "12":
      name = "December";
      break;
    default:
      break;

  }

  return name;
}


function dateFormatter(date) {
  let splitDate = date.split("-");
  let month     = monthName(splitDate[1]);

  return `${month} ${splitDate[2]}, ${splitDate[0]}`
}