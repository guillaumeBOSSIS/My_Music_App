// Formulaire de recherche
const textInput = document.querySelector("#search-txt");
const formInput = document.querySelector("form");

// Menu déroulant du formulaire de recherche
const selected = document.querySelector(".selected");
const optionsContainer = document.querySelector(".options-container");
const optionsList = document.querySelectorAll(".option");

selected.addEventListener("click", () => {
    optionsContainer.classList.toggle("active");
});

let criteria = "";

optionsList.forEach(o => {
  o.addEventListener("click", () => {
    selected.textContent = o.querySelector("label").textContent;
    optionsContainer.classList.remove("active");
    criteria = o.querySelector("input").value;
  });
});

// Pour les erreur de saisie
const errorFormInput = document.querySelector(".error-form");
const errorMessageInput = document.querySelector(".error-message");

// Résultats d'une recherche
const heroResultsItemInput = document.querySelector(".hero-results-item");
const heroLinkInput = document.querySelector(".hero-link");

// Loaders
const heroLoaderInput = document.querySelector("#hero-loader");
const moreResultsLoaderInput = document.querySelector("#more-results-loader");
const coversLoaderInput = document.querySelector("#covers-loader");

// Liste de résultats de recherche
const resultListInput = document.querySelector(".results-list");

// Habillage

const noCoverArtInput = document.querySelector("#no-cover-art");

// Bouton pour afficher plus de résultats
const btnMore = document.querySelector("#btn-next-results");
btnMore.style.visibility = "hidden";

// Modale
const modalHeaderInput = document.querySelector("#modal-h2");
const modalTitleInput = document.querySelector("#modal-info-title");
const modalArtistInput = document.querySelector("#modal-info-artist");
const modalAlbumInput = document.querySelector("#modal-info-album");
const modalGenresInput = document.querySelector("#modal-info-genres");
const modalLengthInput = document.querySelector("#modal-info-length");
const modalNoteInfoInput = document.querySelector("#modal-info-note");
const modalNoteStarsContourInput = document.querySelector(".modal-stars-contour");
const modalNoteStarsFillInput = document.querySelector(".modal-stars-fill");
const modalCoversInput = document.querySelector("#modal-cover-list");

const modal = document.querySelector("#myModal");
const closeModal = document.getElementsByClassName("close")[0];

// Ferme la modale
closeModal.addEventListener("click", function() {
    modal.style.display = "none";
    countCoverArt = 0;
    document.querySelector("body").style.overflow = 'visible';
    emptyModal();
});

// Ferme la modale si on clique en dehors d'elle
window.addEventListener("click", function(ev) {
    if (ev.target == modal) {
        modal.style.display = "none";
        countCoverArt = 0;
        document.querySelector("body").style.overflow = 'visible';
        emptyModal();
      }
});
//----------------------------------------------------------------------------

//Initialisation des sections results
const resultsHeaderSection = document.querySelector(".results-header");
resultsHeaderSection.style.display = "none";
const resultsDisplaySection = document.querySelector(".results-display");
resultsDisplaySection.style.display = "none";

let limit = 25;
let offsetDisplay = 0;
let resultNumber = 0;
let criteriaSearch = '';

let requestsForCoversCount = 0;
let atLeastOneCoverArtFound = false;



// On écoute le formulaire et on appelle la fonction searchMusic lors d'un click sur le bouton Search
formInput.addEventListener("submit", function(ev) {
    ev.preventDefault();

    heroResultsItemInput.style.display = "none";
    heroLinkInput.style.display = "none";

    // Traitement de la saisie, on enlève les espace avant et après
    const cleanTextInput = textInput.value.trim();

    // Traitement des oublis de saisie ou de sélection de critère du formulaire
    // Si c'est bon on lance la recherche
    if (cleanTextInput === '' || criteria === '') {
        if (cleanTextInput === '') {
            errorMessageInput.textContent = "You need to type something";
        } else if (criteria === '') {
            errorMessageInput.textContent = "You need to choose a criterion.";
        }
        errorFormInput.style.display = "block";
        window.addEventListener("click", function() {
            errorFormInput.style.display = "none";
        });
    }
    else {
        heroLoaderInput.style.visibility = "visible";
        // On vide la liste des résultats affichés (si il y en avait) et on masque les section de résultat
        resultListInput.textContent = '';
        resultsHeaderSection.style.display = "none";
        resultsDisplaySection.style.display = "none";

        offsetDisplay = 0;

        // Encodage et formatage du paramètre de la recherche
        const textInputForXHR = encodeURIComponent(cleanTextInput);
        switch (criteria) {
            case "artist":
                criteriaSearch = 'artistname:"' + textInputForXHR + '"';
                break;
            case "album":
                criteriaSearch = 'release:"' + textInputForXHR + '"';
                break
            case "title":
                criteriaSearch = 'recording:"' + textInputForXHR + '"';
                break;
            case "everything":
                criteriaSearch = 'artistname:"' + textInputForXHR + '" OR '
                                + 'release:"' + textInputForXHR + '" OR '
                                + 'recording:"' + textInputForXHR + '"';
                break;
        }

        searchMusic(criteriaSearch, limit, offsetDisplay);
    }
});


// Fonction de recherche ---------------------------------------
// @param criteria : le critere de recherche (field + saisie)
// @param limit : nb de résultats qui seront affichés (max 100)
// @param offset : index à partir duquel on affiche les résultats
// --------------------------------------------------------------
function searchMusic(criteria, limit, offset) {

    const request = new XMLHttpRequest();
    request.open("GET", 'https://musicbrainz.org/ws/2/recording/?query='
                        + criteria
                        // + '"' + encodeURIComponent(text) + '"'
                        + '&fmt=json'
                        + '&limit=' + limit
                        + '&offset=' + offset, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.addEventListener("readystatechange", function (){
        if (request.readyState === XMLHttpRequest.DONE) {
            heroLoaderInput.style.visibility = "hidden";
            moreResultsLoaderInput.style.visibility = "hidden";
            if (request.status === 200) {               
                const response = JSON.parse(request.responseText);
                displayResultNumber(response["count"]);
                resultNumber = response["count"];

                for (let i = 0; i < (response["recordings"].length); i++){
                    offset += 1;
                    let artist = response["recordings"][i]["artist-credit"][0]["name"];
                    let title = response["recordings"][i]["title"];
                    let album = '';
                    
                    if (response["recordings"][i]["releases"] === undefined) {
                        album = '- no album -';
                    } else {
                        album = response["recordings"][i]["releases"][0]["title"];
                    }                   
                    let recording = response["recordings"][i];
                    let mbid = response["recordings"][i]["id"];
                    addResult(offset, artist, title, album, recording, mbid);
                }
                offsetDisplay = offset;

                if (resultNumber > 0) {
                    resultsHeaderSection.style.display = "block";
                    resultsDisplaySection.style.display = "block";
                }

                if (resultNumber > offsetDisplay) {   
                    showMoreResultButton(offsetDisplay);
                }
            } else {
                alert("ERROR : something went wrong during search for music"); 
            }
        }
    });
    request.send();   
}


// Ajoute une ligne de résultat dans la page HTML ------------------------
function addResult(index, artist, title, album, fullRecording, mbid) {

    const newResultItem = document.createElement("li");
    newResultItem.classList.add("result-item");

    const newResultID = document.createElement("span");
    newResultID.textContent = index;

    const newResultArtist = document.createElement("span");
    newResultArtist.textContent = artist;

    const newResultTitle = document.createElement("span");
    newResultTitle.textContent = title;

    const newResultAlbum = document.createElement("span");
    newResultAlbum.textContent = album;

    // Bouton pour ouvrir la modale
    const btnModalContent = document.createElement("span");
    btnModalContent.classList.add("fas");
    btnModalContent.classList.add("fa-plus");

    const btnModal = document.createElement("button");
    btnModal.classList.add("btn-item");
    btnModal.type = "button";
    btnModal.textContent = "More";
    btnModal.addEventListener("click", function() {
        modal.style.display = "block";
        document.querySelector("body").style.overflow = 'hidden';
        moreInformations(fullRecording, mbid);
    });
    btnModal.appendChild(btnModalContent);
    
    newResultItem.appendChild(newResultID);
    newResultItem.appendChild(newResultArtist);
    newResultItem.appendChild(newResultTitle);
    newResultItem.appendChild(newResultAlbum);
    newResultItem.appendChild(btnModal);
    resultListInput.appendChild(newResultItem);
}


// Fonction qui affiche le bouton pour afficher les résultats suivants et le prépare
function showMoreResultButton(offsetToStart) {
    btnMore.style.visibility = "visible";
    // displayLoader(false);
    btnMore.addEventListener("click", function() {
        btnMore.style.visibility = "hidden";
        moreResultsLoaderInput.style.visibility = "visible";
        searchMusic(criteriaSearch, limit, offsetToStart);
    }, { once: true });
}



// Fonction qui affiche le nombre de résultats de la recherche dans la section hero
//-----------------------------------------------------------------
function displayResultNumber(number) {
    heroLoaderInput.style.visibility = "hidden";
    heroResultsItemInput.style.display = "block";
    let textResult = '';
    switch (true) {
        case number === 0:
            textResult = "No result found... Try a new search.";
            break;
        case number === 1:
            textResult = number + " result";
            heroLinkInput.style.display = "block";
            break;
        case number > 1:
            textResult = number + " results";
            heroLinkInput.style.display = "block";
            break;
    }
    heroResultsItemInput.textContent = textResult;
}


// Fonction qui va chercher plus d'infos sur le titre
// ---------------------------------------------------
function moreInformations (fullRecording, mbid) {
   
    coverArts = [];
    const request = new XMLHttpRequest();
    request.open("GET", 'https://musicbrainz.org/ws/2/recording/'
                        + mbid
                        + '?inc='
                        + 'artists'
                        + '+genres'
                        + '+ratings'
                        + '+releases'
                        + '&fmt=json'
                        , true);
    request.setRequestHeader("Content-Type", "application/json");
    request.addEventListener("readystatechange", function (){
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                const response = JSON.parse(request.responseText);

                // Genres --
                let genres = '';
                if (response['genres'].length === 0 ) {
                    genres = 'no genres available';
                } else {
                    for(let i = 0; i < (response['genres']).length; i++) {
                        genres += ((response['genres'][i]['name']) + ', ');
                    }
                    genres = genres.slice(0, -2);
                }

                // Note --
                let rating = response['rating']['value'];
                
                // Cover Arts --
                let releases = response['releases'];

                fillModal(fullRecording, mbid, genres, rating, releases);

            } else {
                alert("ERROR : something went wrong during search for more informations");
            }
        }
    });
    request.send();
}

// Fonction qui rempli la modale
function fillModal(fullRecording, mbid, genres, rating, releases) {

    modalCoversInput.textContent = '';

    // Modal Header
    modalHeaderInput.textContent = fullRecording["artist-credit"][0]["name"] + ' - ' + fullRecording["title"];

    // Modal Title
    modalTitleInput.textContent = fullRecording["title"];

    // Modal Artist
    modalArtistInput.textContent = fullRecording["artist-credit"][0]["name"];

    // Modal Albums
    let modalAlbums = '';
    const releasesNumber = fullRecording["releases"].length;
    switch (true) {
        case releasesNumber === 0:
            modalAlbums = 'no album available';
            break;
        case releasesNumber >= 1:
            for(let i = 0; i < releasesNumber; i++) {
                modalAlbums +=  fullRecording["releases"][i]["title"] +
                                ' (' + fullRecording["releases"][i]["country"] + '), ';
            }
            modalAlbums = modalAlbums.substring(0, modalAlbums.length - 2);
            break;
    }
    modalAlbumInput.textContent = modalAlbums;

    // Modal Genres
    modalGenresInput.textContent = genres;

    // Modal Length
    if (fullRecording["length"] != null) {
        const lengthMinutes = Math.floor(((fullRecording["length"]) / 60000));
        const lengthSeconds = (((fullRecording["length"]) % 60000) / 1000).toFixed(0);
        modalLengthInput.textContent = lengthMinutes + ":" + (lengthSeconds < 10 ? '0' : '') + lengthSeconds;
    } else {
        modalLengthInput.textContent = "no length available";
    }

    // Modal Note
    const noteMax = 5;
    if (rating != null) {
        modalNoteInfoInput.textContent = "";
        modalNoteStarsContourInput.style.display = "inline-block";
        // const notePercentageRounded = Math.round(((rating/noteMax) * 100) / 10) * 10;
        // const widthCSS = '' + notePercentageRounded + '%';
        // modalNoteInput.style.width = '' + notePercentageRounded + '%';
    
        // Note arrondie à 0.5 près
        const notePercentage = Math.round(((rating/noteMax) * 100) / 10) * 10;
        modalNoteStarsFillInput.style.width = '' + notePercentage + '%';
    } else {
        modalNoteInfoInput.textContent = "no rating available";
        modalNoteStarsContourInput.style.display = "none";
    }

    // Modal Cover art

    //Fonction de callback qui ajoute un cover art
    function insertCoverArt(url) {
        const newCoverItem = document.createElement("li");
        const newCoverImage = document.createElement("img");
        newCoverImage.classList.add("cover-art");
        newCoverImage.src = url;
        newCoverItem.appendChild(newCoverImage);
        modalCoversInput.appendChild(newCoverItem);

        if (requestsForCoversCount === 0) {
            coversLoaderInput.style.visibility = "hidden";
        }

        // TODO Non fonctionnel - si aucune cover
        if ((requestsForCoversCount === 0) && (atLeastOneCoverArtFound === false)) {
            coversLoaderInput.style.visibility = "hidden";
            const noCoverItem = document.createElement("li");
            noCoverItem.textContent = "- no cover art found -"
            modalCoversInput.appendChild(noCoverItem);
        }
    }
    // Pour chaque release on tente de récupérer ses covers
    for (let i = 0; i < releases.length; i++) {
        getCoverArtByRelease(releases[i]['id'], insertCoverArt);
        requestsForCoversCount++;
        coversLoaderInput.style.visibility = "visible";
    }
}


// Fonction qui recupère les cover art d'un release et lance le callback
function getCoverArtByRelease(MBIDRelease, callback) {
    const request = new XMLHttpRequest();
    request.open("GET", 'https://coverartarchive.org/release/'
                        + MBIDRelease, true);
    // request.setRequestHeader("Content-Type", "application/json");
    request.addEventListener("readystatechange", function (){
        if (request.readyState === XMLHttpRequest.DONE) {
            requestsForCoversCount--;
            if (request.status === 200) { 
                
                const response = JSON.parse(request.responseText);
                for (let i = 0; i < response['images'].length; i++) {
                    atLeastOneCoverArtFound = true;
                    callback(response['images'][i]['thumbnails']['small']);             
                }
            }
        }
    });
    request.send();   
}


// Fonction qui vide la modale
function emptyModal() {
    modalHeaderInput.textContent = '';
    modalTitleInput.textContent = '';
    modalArtistInput.textContent = '';
    modalAlbumInput.textContent = '';
    modalGenresInput.textContent = '';
    modalLengthInput.textContent = '';
    modalNoteInfoInput.textContent = '';
    modalCoversInput.textContent = '';
    requestsForCoversCount = 0;
    atLeastOneCoverArtFound = false;
}


// DESIGN - Gestion de l'opacité du background du header
const headerInput = document.querySelector(".main-header");
window.addEventListener('scroll', () => {
    if (pageYOffset >= 100) {
        headerInput.style.backgroundColor = '#001434'
    }
    else {
        headerInput.style.backgroundColor = 'transparent'
    }
});


// DESIGN - Bouton pour revenir tout en haut de la page
const btnTopInput = document.querySelector("#btn-top");
btnTopInput.style.display = "none";
window.addEventListener('scroll', () => {
    if (pageYOffset >= 200) {
        btnTopInput.style.display = "flex";
    }
    else {
        btnTopInput.style.display = "none";
    }
});