document.addEventListener('DOMContentLoaded', () => {
    incarcaStudenti(); // Încarcă lista la pornirea paginii

    // Ascultă evenimentul de submit al formularului
    document.getElementById('studentForm').addEventListener('submit', async (e) => {
        e.preventDefault(); // Oprește refresh-ul paginii

        // Colectăm datele din formular
        const nume = document.getElementById('nume').value;
        const an = document.getElementById('an').value;
        const media = document.getElementById('media').value;

        // Construim obiectul student
        const studentNou = { nume, an, media };

        // Trimitem datele prin POST către API
        try {
            const response = await fetch('api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentNou)
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('Student adăugat cu succes!');
                document.getElementById('studentForm').reset(); // Curăță formularul
                incarcaStudenti(); // Reîncarcă lista fără refresh
            } else {
                alert('Eroare: ' + result.message);
            }
        } catch (error) {
            console.error('Eroare la fetch:', error);
        }
    });
});

// Funcție pentru a lua studenții din DB și a-i afișa în tabel
async function incarcaStudenti() {
    try {
        const response = await fetch('api.php'); // Default e GET
        const studenti = await response.json();

        const tbody = document.getElementById('listaStudenti');
        tbody.innerHTML = ''; // Curăță tabelul înainte de repopulare

        studenti.forEach(student => {
            const row = `
                <tr>
                    <td>${student.id}</td>
                    <td>${student.nume}</td>
                    <td>Anul ${student.an}</td>
                    <td><strong>${student.media}</strong></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Eroare la încărcarea studenților:', error);
    }
}