const inputActivitate = document.getElementById('inputActivitate');
const btnAdauga = document.getElementById('btnAdauga');
const listaActivitati = document.getElementById('listaActivitati');

const luniAn = [
    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

btnAdauga.addEventListener('click', function() {
    const textActivitate = inputActivitate.value.trim();

    if (textActivitate !== "") {
        
        const dataCurenta = new Date();
        const zi = dataCurenta.getDate(); // Ziua (1-31)
        const indexLuna = dataCurenta.getMonth(); // Luna (0-11)
        const an = dataCurenta.getFullYear(); // Anul (ex: 2025)
        
        const numeLuna = luniAn[indexLuna];

        const elementNou = document.createElement('li');
        
        elementNou.textContent = `${textActivitate} – adăugată la: ${zi} ${numeLuna} ${an}`;

        listaActivitati.appendChild(elementNou);

        inputActivitate.value = "";
    } else {
        alert("Te rog introdu o activitate înainte de a apăsa butonul!");
    }
});