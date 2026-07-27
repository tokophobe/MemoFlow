// =====================================
// MemoFlow V2
// Partie 1 : Base IndexedDB
// =====================================


// -----------------------------
// Variables globales
// -----------------------------

let db;
let cards = [];
let currentCard = null;


// -----------------------------
// Ouverture de la base
// -----------------------------

const request = indexedDB.open(
    "MemoFlowDB",
    1
);


request.onupgradeneeded = function(event) {

    db = event.target.result;


    if (!db.objectStoreNames.contains("questions")) {

        let store = db.createObjectStore(
            "questions",
            {
                keyPath: "id"
            }
        );


        store.createIndex(
            "nextReview",
            "nextReview"
        );

    }

};



request.onsuccess = function(event) {

    db = event.target.result;

    console.log("Base MemoFlow ouverte");

    loadCards();

};



request.onerror = function() {

    console.error(
        "Impossible d'ouvrir la base"
    );

};



// -----------------------------
// Chargement des cartes
// -----------------------------

function loadCards() {


    let transaction =
        db.transaction(
            "questions",
            "readonly"
        );


    let store =
        transaction.objectStore(
            "questions"
        );


    let request =
        store.getAll();



    request.onsuccess = function() {


        cards = request.result;


        console.log(
            cards.length +
            " questions chargées"
        );


        updateCounter();
	displayQuestions();
	updateStats();

    };

}



// -----------------------------
// Sauvegarder une carte
// -----------------------------

function saveCard(card) {


    let transaction =
        db.transaction(
            "questions",
            "readwrite"
        );


    let store =
        transaction.objectStore(
            "questions"
        );


    store.put(card);

}



// -----------------------------
// Ajouter une question
// -----------------------------

document
.getElementById("add")
.onclick = function() {


    let category =
        document
        .getElementById("category")
        .value
        .trim();


    let question =
        document
        .getElementById("question")
        .value
        .trim();


    let answer =
        document
        .getElementById("answer")
        .value
        .trim();

if (editingId !== null) {


    let card =
        cards.find(
            c =>
            c.id === editingId
        );


    card.category = category;

    card.question = question;

    card.answer = answer;


    saveCard(card);


    editingId = null;


    document
    .getElementById("add")
    .innerText =
        "Ajouter";


    loadCards();


    alert(
        "Question modifiée"
    );


    return;

}

    if (!question || !answer) {

        alert(
            "Question et réponse obligatoires"
        );

        return;
    }



    let card = {


        id: Date.now(),


        category:
            category || "Sans catégorie",


        question: question,


        answer: answer,


        // paramètres mémoire

        level: 0,


        correctCount: 0,


        errorCount: 0,


        lastReview: null,


        nextReview:
            Date.now()

    };



    saveCard(card);



    cards.push(card);



    document
    .getElementById("category")
    .value = "";


    document
    .getElementById("question")
    .value = "";


    document
    .getElementById("answer")
    .value = "";



    updateCounter();
    updateStats();


    alert(
        "Question ajoutée"
    );

};



// -----------------------------
// Questions à réviser
// -----------------------------

function getDueCards() {


    let now =
        Date.now();


    return cards.filter(
        card =>
        card.nextReview <= now
    );

}



// -----------------------------
// Compteur affiché
// -----------------------------

function updateCounter() {


    let element =
        document.getElementById(
            "counter"
        );


    if (!element) return;


    let due =
        getDueCards();



    element.innerHTML =
        due.length +
        " question(s) à réviser";

}

// =====================================
// MemoFlow V2
// Partie 2 : Moteur de révision
// =====================================



// -----------------------------
// Démarrer une session de révision
// -----------------------------

document
.getElementById("startReview")
.onclick = function() {


    let due =
        getDueCards();



    if (due.length === 0) {

        alert(
            "Aucune question à réviser"
        );

        return;
    }



    // choix aléatoire

    currentCard =
        due[
            Math.floor(
                Math.random() * due.length
            )
        ];



    document
    .getElementById("home")
    .classList
    .add("hidden");



    document
    .getElementById("review")
    .classList
    .remove("hidden");



    afficherCarte();

};




// -----------------------------
// Affichage d'une carte
// -----------------------------

function afficherCarte() {


    document
    .getElementById("categoryReview")
    .innerText =
        currentCard.category;



    document
    .getElementById("questionReview")
    .innerText =
        currentCard.question;



    document
    .getElementById("answerReview")
    .innerText =
        currentCard.answer;



    document
    .getElementById("answerReview")
    .classList
    .add("hidden");

}



// -----------------------------
// Afficher la réponse
// -----------------------------

document
.getElementById("showAnswer")
.onclick = function() {


    document
    .getElementById("answerReview")
    .classList
    .remove("hidden");

};




// -----------------------------
// Intervalles de répétition
// -----------------------------

function getInterval(level) {


    let intervals = [

        10 * 60 * 1000,          // 10 minutes

        24 * 3600 * 1000,        // 1 jour

        3 * 24 * 3600 * 1000,    // 3 jours

        7 * 24 * 3600 * 1000,    // 1 semaine

        15 * 24 * 3600 * 1000,   // 15 jours

        30 * 24 * 3600 * 1000,   // 1 mois

        60 * 24 * 3600 * 1000,   // 2 mois

        120 * 24 * 3600 * 1000   // 4 mois

    ];



    return intervals[
        Math.min(
            level,
            intervals.length - 1
        )
    ];

}




// -----------------------------
// Réponse correcte
// -----------------------------

document
.getElementById("correct")
.onclick = function() {


    currentCard.level++;


    currentCard.correctCount++;


    currentCard.lastReview =
        Date.now();



    currentCard.nextReview =
        Date.now()
        +
        getInterval(
            currentCard.level
        );



    saveCard(currentCard);



    refreshCards();



    finRevision();

};





// -----------------------------
// Réponse fausse
// -----------------------------

document
.getElementById("wrong")
.onclick = function() {


    currentCard.level = 0;


    currentCard.errorCount++;


    currentCard.lastReview =
        Date.now();



    currentCard.nextReview =
        Date.now()
        +
        getInterval(0);



    saveCard(currentCard);



    refreshCards();



    finRevision();

};




// -----------------------------
// Actualiser la liste mémoire
// -----------------------------

function refreshCards() {


    let index =
        cards.findIndex(
            c =>
            c.id === currentCard.id
        );



    if (index !== -1) {

        cards[index] =
            currentCard;

    }

}



// -----------------------------
// Retour écran principal
// -----------------------------

function finRevision() {


    document
    .getElementById("review")
    .classList
    .add("hidden");



    document
    .getElementById("home")
    .classList
    .remove("hidden");



    updateCounter();
    updateStats();

}


// =====================================
// MemoFlow V2
// Partie 3 : Import / Export
// =====================================



// -----------------------------
// Export Excel
// -----------------------------

document
.getElementById("exportExcel")
.onclick = function() {


    let data =
        cards.map(card => ({

            Categorie:
                card.category,

            Question:
                card.question,

            Reponse:
                card.answer,

            Niveau:
                card.level,

            Correct:
                card.correctCount,

            Erreurs:
                card.errorCount,

            Prochaine_revision:
                new Date(
                    card.nextReview
                ).toLocaleString()

        }));



    let worksheet =
        XLSX.utils.json_to_sheet(data);



    let workbook =
        XLSX.utils.book_new();



    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Questions"
    );



    XLSX.writeFile(
        workbook,
        "MemoFlow_questions.xlsx"
    );

};





// -----------------------------
// Export CSV
// -----------------------------

document
.getElementById("exportCSV")
.onclick = function() {


    let csv =
        "Categorie;Question;Reponse;Niveau;Correct;Erreurs\n";



    cards.forEach(card => {


        csv +=
        `"${card.category}";`+
        `"${card.question}";`+
        `"${card.answer}";`+
        `${card.level};`+
        `${card.correctCount};`+
        `${card.errorCount}\n`;

    });



    let blob =
        new Blob(
            [csv],
            {
                type:
                "text/csv;charset=utf-8"
            }
        );



    let url =
        URL.createObjectURL(blob);



    let link =
        document.createElement("a");



    link.href = url;

    link.download =
        "MemoFlow_questions.csv";


    link.click();

};






// -----------------------------
// Import Excel
// -----------------------------

document
.getElementById("importExcel")
.onchange = function(event) {


    let file =
        event.target.files[0];


    if (!file) return;



    let reader =
        new FileReader();



    reader.onload =
    function(e) {


        let data =
            new Uint8Array(
                e.target.result
            );



        let workbook =
            XLSX.read(
                data,
                {
                    type:"array"
                }
            );



        let sheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ];



        let rows =
            XLSX.utils.sheet_to_json(
                sheet
            );



        rows.forEach(row => {


            let card = {


                id:
                    Date.now()
                    +
                    Math.random(),



                category:
                    row.Categorie
                    ||
                    "Sans catégorie",



                question:
                    row.Question
                    ||
                    "",



                answer:
                    row.Reponse
                    ||
                    "",



                level:
                    row.Niveau
                    ||
                    0,



                correctCount:
                    row.Correct
                    ||
                    0,



                errorCount:
                    row.Erreurs
                    ||
                    0,



                lastReview:
                    null,



                nextReview:
                    Date.now()

            };



            saveCard(card);



            cards.push(card);


        });



        updateCounter();



        alert(
            rows.length
            +
            " questions importées"
        );


    };



    reader.readAsArrayBuffer(file);

};

// =====================================
// Liste des questions
// =====================================


// Affichage de la liste

function displayQuestions() {


    let container =
        document.getElementById(
            "questionList"
        );


    if (!container) return;


    container.innerHTML = "";


    let search =
        document
        .getElementById("search")
        .value
        .toLowerCase();



    let filtered =
        cards.filter(card => {


            return (

                card.question
                .toLowerCase()
                .includes(search)

                ||

                card.category
                .toLowerCase()
                .includes(search)

            );

        });



    filtered.forEach(card => {


        let div =
            document.createElement("div");


        div.className =
            "card";


        div.innerHTML = `

        <b>${card.category}</b>

        <p>${card.question}</p>

        <button 
	onclick="editQuestion(${card.id})">
	✏️ Modifier
	</button>

	<button 
	onclick="deleteQuestion(${card.id})">
	🗑 Supprimer
	</button>

        `;


        container.appendChild(div);


    });

}



// Mise à jour automatique lors de la recherche

document
.getElementById("search")
.addEventListener(
    "input",
    displayQuestions
);




// Suppression d'une question

function deleteQuestion(id) {


    if (
        !confirm(
            "Supprimer cette question ?"
        )
    ) {
        return;
    }



    let transaction =
        db.transaction(
            "questions",
            "readwrite"
        );



    transaction
    .objectStore("questions")
    .delete(id);



    cards =
        cards.filter(
            card =>
            card.id !== id
        );



    updateCounter();

    displayQuestions();

}

// =====================================
// Modification d'une question
// =====================================


let editingId = null;



function editQuestion(id) {


    let card =
        cards.find(
            c => c.id === id
        );


    if (!card) return;


    editingId = id;


    document
    .getElementById("category")
    .value =
        card.category;


    document
    .getElementById("question")
    .value =
        card.question;


    document
    .getElementById("answer")
    .value =
        card.answer;



    document
    .getElementById("add")
    .innerText =
        "Modifier";



    window.scrollTo(
        {
            top:0,
            behavior:"smooth"
        }
    );

}

// =====================================
// Statistiques
// =====================================


function updateStats() {


    let total =
        cards.length;



    let due =
        getDueCards().length;



    let correct =
        cards.reduce(
            (sum, card) =>
            sum + card.correctCount,
            0
        );



    let errors =
        cards.reduce(
            (sum, card) =>
            sum + card.errorCount,
            0
        );



    let totalAnswers =
        correct + errors;



    let rate =
        totalAnswers > 0
        ?
        Math.round(
            correct /
            totalAnswers *
            100
        )
        :
        0;



    let mastered =
        cards.filter(
            card =>
            card.level >= 5
        ).length;



    let difficult =
        cards.filter(
            card =>
            card.errorCount >= 3
        ).length;



    document
    .getElementById("totalCards")
    .innerText =
        "Questions totales : "
        + total;



    document
    .getElementById("dueCards")
    .innerText =
        "À réviser aujourd'hui : "
        + due;



    document
    .getElementById("successRate")
    .innerText =
        "Taux de réussite : "
        + rate
        + " %";



    document
    .getElementById("masteredCards")
    .innerText =
        "Questions maîtrisées : "
        + mastered;



    document
    .getElementById("difficultCards")
    .innerText =
        "Questions difficiles : "
        + difficult;

}