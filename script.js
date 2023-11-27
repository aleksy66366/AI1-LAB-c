// Zmienna do śledzenia zgód
let isLocationAgreed = false;
let isNotificationsAgreed = false;
let map;
let mapElement = document.getElementById('puzzle-container');
let maptmp;
let dataURL;

disableButtons();

function testButtons(){
    if(isLocationAgreed&&isNotificationsAgreed){
        enableButtons();
    }
    else{
        disableButtons();
    }
}

// Funkcja do dezaktywacji i zmiany koloru przycisków
function disableButtons() {
    const buttons = document.querySelectorAll('button:not(#getLocationAgree):not(#notificationsAgree)');
    buttons.forEach(button => {
        button.disabled = true;
        button.style.backgroundColor = 'red';
        button.style.cursor = 'not-allowed';
    });
}

// Funkcja do aktywacji przycisków po uzyskaniu obydwu zgód
function enableButtons() {
    if (isLocationAgreed && isNotificationsAgreed) {
        const buttons = document.querySelectorAll('button:not(#getLocationAgree):not(#notificationsAgree)');
        buttons.forEach(button => {
            button.disabled = false;
            button.style.backgroundColor = ''; // Usunięcie koloru, aby wrócił do domyślnego
            button.style.cursor = 'pointer';
        });
    }
}

document.getElementById('getLocationAgree').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('Pozycja uzyskana:', position);
            isLocationAgreed = true;
            testButtons();
        },
        (error) => {
            console.error('Błąd uzyskiwania lokalizacji:', error.message);
            isLocationAgreed = true;
            testButtons();
        }
    );
});

document.getElementById('notificationsAgree').addEventListener('click', () => {
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Powiadomienia są włączone.');
            isNotificationsAgreed = true;
            testButtons();
        } else {
            console.warn('Prośba o powiadomienia została odrzucona.');
            isNotificationsAgreed = true;
            testButtons();
        }
    });
});



// Reusable function to get location and update the map
function getLocationAndUpdateMap() {
    if (isLocationAgreed) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Pozycja uzyskana:', position);

                // Clear the existing map if it exists
                if (map) {
                    map.remove();
                }

                // Create a new map
                map = L.map('map').setView([position.coords.latitude, position.coords.longitude], 13);

                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(map);
                

                document.getElementById('local1').innerText = 'Szerokość: ' + position.coords.latitude;
                document.getElementById('local2').innerText = 'Długość: ' + position.coords.longitude;
            },
            (error) => {
                console.error('Błąd uzyskiwania lokalizacji:', error.message);
                document.getElementById('local1').innerText = 'Błąd uzyskiwania lokalizacji';
                document.getElementById('local2').innerText = '';
            }
        );
    } else {
        alert('Zgoda na lokalizację jest wymagana.');
    }
}


// Add event listener to the "Pobierz lokalizację" button
document.getElementById('getLocation').addEventListener('click', getLocationAndUpdateMap);


document.getElementById("getMap").addEventListener("click", () => {
    const width = 512;
    const height = 512;
    const tileSize=height/4;

    let location = map.getCenter();
    let zoom = map.getZoom();

    //console.log(location.lat + ' '+ location.lng+' '+zoom);

    const createMapImage = async () => {
        
        maptmp= L.map(mapElement, {
            attributionControl: false,
            zoomControl: false,
            fadeAnimation: false,
            zoomAnimation: false
        });
        maptmp.setView([location.lat, location.lng], zoom);
    
        let tileLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ).addTo(maptmp);
    
        await new Promise(resolve => tileLayer.on("load", () => resolve()));
        dataURL = await domtoimage.toPng(mapElement, { width, height});

        mapElement.innerHTML = '';
        var img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = dataURL;

        var imageArray = [];

        img.onload = function() {
            // Tworzymy wirtualne płótna dla każdego wycinka (4 wiersze x 4 kolumny)
            for (var row = 0; row < 4; row++) {
                for (var col = 0; col < 4; col++) {
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    canvas.width = img.width / 4;  // szerokość jednego wycinka
                    canvas.height = img.height / 4;  // wysokość jednego wycinka
        
                    // Wycinamy fragment i rysujemy na wirtualnym płótnie
                    ctx.drawImage(img, col * canvas.width, row * canvas.height, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        
                    // Tworzymy nowy obraz z danego wycinka i dodajemy do tablicy
                    var slicedImage = new Image();
                    slicedImage.src = canvas.toDataURL();  // przekształcamy płótno na dane URL obrazu
                    imageArray.push(slicedImage);
                }
            }
        
            // Teraz imageArray zawiera 16 elementów będących wycinkami oryginalnego obrazu
            //console.log(imageArray[0].src);
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const piece = document.createElement('div');
                    piece.className = 'puzzle-piece';
                    piece.style.width = tileSize + 'px';
                    piece.style.height = tileSize + 'px';
                    piece.style.float = 'left';
                    piece.style.border = '0px solid #333';
                    piece.style.backgroundImage = `url(${imageArray[4*row+col].src})`;
                    
                    piece.innerHTML=`row: ${row}, col: ${col}`;
                    piece.id = `piece-${row}-${col}`;
                    
                    mapElement.appendChild(piece);
                }
            }
        };
        maptmp.remove();
    };
    createMapImage();
});
// Dodaj event listener do przycisku "Przemieszaj"
document.getElementById('shuffle').addEventListener('click', () => {
    shufflePieces();
});


// Funkcja do przemieszczania elementów losowo
function shufflePieces() {
    const pieces = document.querySelectorAll('.puzzle-piece');
    const shuffledPieces = Array.from(pieces).sort(() => Math.random() - 0.5);

    // Wyczyść mapElement
    mapElement.innerHTML = '';

    // Dodaj elementy w losowej kolejności
    shuffledPieces.forEach(piece => {
        mapElement.appendChild(piece);
        enableDragAndDrop();
    });
}

function enableDragAndDrop() {
    const pieces = document.querySelectorAll('.puzzle-piece');

    pieces.forEach(piece => {
        piece.draggable = true;
        piece.addEventListener('dragstart', dragStart);
        piece.addEventListener('dragover', dragOver);
        piece.addEventListener('drop', dragDrop);
    });
}

document.body.addEventListener('dragover', dragOver);
document.body.addEventListener('drop', dragDrop);

function dragStart(e) {
    const draggedPieceId = e.target.id;
    e.dataTransfer.setData("text/plain", draggedPieceId);
}

function dragOver(e) {
    e.preventDefault();
    // Dodaj dodatkowe efekty wizualne, jeśli to konieczne
}

function dragDrop(e) {
    e.preventDefault();

    const draggedPieceId = e.dataTransfer.getData("text/plain");
    const draggedPiece = document.getElementById(draggedPieceId);

    // Sprawdź, czy element istnieje
    if (!draggedPiece) {
        console.error(`Element with id ${draggedPieceId} does not exist.`);
        return;
    }

    const computedStyle = document.defaultView.getComputedStyle(draggedPiece);
    //console.log(draggedPieceId);
    
    const backgroundImage = computedStyle.backgroundImage;

    const imageUrl = backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');

    const img = new Image();
    img.src = imageUrl;
   
    const canvas = document.getElementById('plansza');
    const canvasRect = canvas.getBoundingClientRect();
    let ctx = canvas.getContext('2d');

    let mouseX = e.clientX - canvasRect.left;
    let mouseY = e.clientY - canvasRect.top;

    mouseX=mouseX-(mouseX%128);
    mouseY=mouseY-(mouseY%128);
    
    img.onload = async function() {
        ctx.drawImage(img, mouseX, mouseY, 128, 128);
        if (await isPuzzleSolved()) {
            alert('Brawo! Układanka ułożona.');
        }
        //console.log(await isPuzzleSolved());
    };
}

document.getElementById('reset').addEventListener('click', function() {
    const canvas = document.getElementById('plansza');
    const ctx = canvas.getContext('2d');

    // Wyczyść canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});


async function isPuzzleSolved() {
    const canvas = document.getElementById('plansza');
    const ctx = canvas.getContext('2d');

    // Pobierz dane obrazu z canvasa
    const canvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Stwórz obraz z oryginalnej mapy przed podziałem
    const originalImage = new Image();
    originalImage.crossOrigin = "Anonymous";
    originalImage.src = dataURL; // Zastąp 'URL_ORIGINAL_IMAGE' odpowiednim adresem URL oryginalnego obrazu

    // Utwórz obraz z oryginalnego zdjecia przed podziałem
    const originalImageCanvas = document.createElement('canvas');
    const originalImageCtx = originalImageCanvas.getContext('2d');
    originalImageCanvas.width = canvas.width;
    originalImageCanvas.height = canvas.height;

    const originalImageData = await new Promise(resolve => {
        originalImage.onload = function() {
            originalImageCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

            // Pobierz dane obrazu z oryginalnej mapy
            resolve(originalImageCtx.getImageData(0, 0, canvas.width, canvas.height));
        };
    });

    // Porównaj dane obrazów
    return isImageDataEqual(canvasImageData, originalImageData);
}

// Funkcja do porównywania danych obrazu
function isImageDataEqual(imageData1, imageData2) {
    const data1 = imageData1.data;
    const data2 = imageData2.data;

    for (let i = 0; i < data1.length; i++) {
        if (data1[i] !== data2[i]) {
            return false;
        }
    }

    return true;
}