const btnDetalii = document.getElementById('btnDetalii');
const divDetalii = document.getElementById('detalii');
const spanData = document.getElementById('dataProdus');

const luniAn = [
    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

window.addEventListener('DOMContentLoaded', () => {
    
    divDetalii.classList.add('ascuns');

    const dataCurenta = new Date();
    const zi = dataCurenta.getDate();
    const lunaIndex = dataCurenta.getMonth();
    const an = dataCurenta.getFullYear();

    const dataFormatata = `${zi} ${luniAn[lunaIndex]} ${an}`;
    
    spanData.textContent = dataFormatata;
});

btnDetalii.addEventListener('click', () => {
    divDetalii.classList.toggle('ascuns');

    if (divDetalii.classList.contains('ascuns')) {
        btnDetalii.textContent = "Afișează detalii";
    } else {
        btnDetalii.textContent = "Ascunde detalii";
    }
});