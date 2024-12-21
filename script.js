// TMDb API key
const apiKey = 'ca7226233e23be7a82f302d0a86d02ad'; // Replace with your TMDb API key

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDLHCpqwj39NzUP-rAOUNerj3em2bdepLw",
    authDomain: "spoilerhub-32c29.firebaseapp.com",
    databaseURL: "https://spoilerhub-32c29-default-rtdb.firebaseio.com",
    projectId: "spoilerhub-32c29",
    storageBucket: "spoilerhub-32c29.firebasestorage.app",
    messagingSenderId: "420414738753",
    appId: "1:420414738753:web:9fec2404469e833e1fd1c0",
    measurementId: "G-EZX36DE3LE"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Google Sign-In
document.getElementById('google-sign-in').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            // User signed in
            const user = result.user;
            console.log('User signed in:', user);
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('user-profile').style.display = 'block';
            document.getElementById('sign-out-button').style.display = 'block';
            document.getElementById('sign-in-button').style.display = 'none';

            // Optional: Save user info in the database if needed
            // saveUserInfo(user);
        })
        .catch((error) => {
            console.error('Error during sign-in:', error);
            alert('Error signing in. Please try again.'); // Alert for error
        });
});

// Sign out user
document.getElementById('sign-out-button').addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log('User signed out');
        document.getElementById('login-page').style.display = 'block';
        document.getElementById('user-profile').style.display = 'none';
        document.getElementById('sign-out-button').style.display = 'none';
        document.getElementById('sign-in-button').style.display = 'block';
    }).catch((error) => {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.'); // Alert for error
    });
});

// Handle profile form submission
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const age = document.getElementById('age').value;
    const languages = document.getElementById('languages').value;
    const interests = document.getElementById('interests').value;
    const genres = document.getElementById('genres').value.split(',').map(g => g.trim()); // Split genres into an array

    if (age && languages && interests && genres.length) {
        console.log({ age, languages, interests, genres });
        fetchPersonalizedTrailers({ age, languages, interests, genres });
    } else {
        alert('Please fill out all fields.');
    }
});

// Fetch and display personalized trailers based on user preferences
async function fetchPersonalizedTrailers(profile) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&region=IN&sort_by=popularity.desc`);
        if (!response.ok) throw new Error('Failed to fetch movies');
        
        const data = await response.json();
        const personalizedMovies = await fetchGenerativeAIRecommendations(profile, data.results);
        displayTrailers(personalizedMovies);
    } catch (error) {
        console.error('Error fetching personalized trailers:', error);
    }
}

function displayTrailers(movies) {
    const moviesContainer = document.querySelector('#personalized-trailers .movies');
    moviesContainer.innerHTML = ''; // Clear previous results
    if (movies.length === 0) {
        moviesContainer.innerHTML = '<p>No personalized movies found.</p>';
        return;
    }
    movies.forEach(async (movie) => {
        const trailer = await fetchTrailer(movie.id);
        const movieDiv = document.createElement('div');
        movieDiv.className = 'movie-item';
        movieDiv.innerHTML = `
            <h3>${movie.title}</h3>
            <p>${movie.overview}</p>
            <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title}">
            ${trailer ? `<iframe width="560" height="315" src="${trailer}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : 'No trailer available'}
        `;
        moviesContainer.appendChild(movieDiv);
    });
}

// Fetch trailer for a specific movie
async function fetchTrailer(movieId) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}`);
        if (!response.ok) throw new Error('Failed to fetch trailer');
        
        const data = await response.json();
        const trailer = data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
        return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    } catch (error) {
        console.error('Error fetching trailer:', error);
        return null; // Return null if there was an error
    }
}

// Generative AI function to get personalized recommendations
async function fetchGenerativeAIRecommendations(profile, movies) {
    return movies.filter(movie => movie.genre_ids.some(genre => profile.genres.includes(genre)));
}