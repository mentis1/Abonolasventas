let events = JSON.parse(localStorage.getItem('abonoEventos')) || [];

function saveEvents() {
  localStorage.setItem('abonoEventos', JSON.stringify(events));
  updateStats();
}

function updateStats() {
  const total = events.length;
  const diego = events.filter(e => e.asistencia === 'diego' || e.asistencia === 'ambos').length;
  const sandra = events.filter(e => e.asistencia === 'sandra' || e.asistencia === 'ambos').length;

  document.getElementById('diegoCount').textContent = `${diego} / ${total}`;
  document.getElementById('sandraCount').textContent = `${sandra} / ${total}`;
  document.getElementById('diegoPercentage').textContent = total ? `${Math.round((diego / total) * 100)}%` : '0%';
  document.getElementById('sandraPercentage').textContent = total ? `${Math.round((sandra / total) * 100)}%` : '0%';
}

function renderEvents() {
  const container = document.getElementById('eventsList');
  container.innerHTML = '';

  // Ordenar los eventos por fecha de más nuevo a más antiguo
  // Almacenar en una variable separada para no modificar el array original si no es necesario en otros puntos
  const sortedEvents = [...events].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  sortedEvents.forEach((event, index) => {
    // Necesitamos encontrar el índice original del evento en el array 'events' para las actualizaciones
    const originalIndex = events.findIndex(e => e === event);

    const card = document.createElement('div');
    card.className = 'eventCard';

    const title = document.createElement('input');
    title.className = 'eventTitle';
    title.value = event.nombre;
    title.placeholder = 'Nombre del evento...';
    title.addEventListener('blur', e => {
      if (events[originalIndex].nombre !== e.target.value) {
        events[originalIndex].nombre = e.target.value;
        saveEvents();
      }
    });

    const date = document.createElement('input');
    date.type = 'date';
    date.value = event.fecha;
    date.min = '2025-01-01';
    date.addEventListener('blur', e => {
      if (events[originalIndex].fecha !== e.target.value) {
        events[originalIndex].fecha = e.target.value;
        saveEvents();
        renderEvents(); // Re-render para mantener el orden si la fecha cambia
      }
    });

    const dateWrapper = document.createElement('div');
    dateWrapper.className = 'eventDate';
    dateWrapper.appendChild(date);

    const options = document.createElement('div');
    options.className = 'options';

    const buttons = [
      { label: 'Ninguno', value: 'ninguno', class: 'none' },
      { label: 'Solo Diego', value: 'diego', class: 'oneDiego' },
      { label: 'Solo Sandra', value: 'sandra', class: 'oneSandra' },
      { label: 'Ambos', value: 'ambos', class: 'both' }
    ];

    buttons.forEach(btn => {
      const b = document.createElement('button');
      b.textContent = btn.label;
      b.className = `optionBtn ${btn.class}`;
      if (event.asistencia === btn.value) b.classList.add('selected');

      b.addEventListener('click', () => {
        events[originalIndex].asistencia = btn.value;
        saveEvents();
        updateStats();
        options.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
        b.classList.add('selected');
      });

      options.appendChild(b);
    });

    const del = document.createElement('button');
    del.className = 'deleteBtn';
    del.textContent = 'Eliminar';
    del.addEventListener('click', () => {
      events.splice(originalIndex, 1);
      saveEvents();
      renderEvents();
    });

    card.appendChild(title);
    card.appendChild(dateWrapper);
    card.appendChild(options);
    card.appendChild(del);
    container.appendChild(card);
  });

  updateStats();
}

document.getElementById('addEventBtn').addEventListener('click', () => {
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  events.push({ nombre: '', fecha: defaultDate, asistencia: 'ninguno' });
  saveEvents();
  renderEvents();
});

document.getElementById('exportBtn').addEventListener('click', async () => {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;
  const total = events.length;
  if (total === 0) return;

  const now = new Date();
  const fechaGeneracion = now.toLocaleDateString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  const crearTexto = (text, opts = {}) => new Paragraph({
    children: [new TextRun({ text, font: "Arial", ...opts })],
  });

  const getPersonaDoc = (persona, nombreMostrar) => {
    const asistencias = events
      .filter(e => e.asistencia === persona || e.asistencia === 'ambos')
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .map(e => {
        const fechaStr = new Date(e.fecha).toLocaleDateString('es-ES', {
          weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const nombreEvento = e.nombre || '(Sin título)';
        return crearTexto(`• ${fechaStr} - ${nombreEvento}`);
      });

    const totalAsistencias = asistencias.length;
    const porcentaje = total ? Math.round((totalAsistencias / total) * 100) : 0;

    return [
      new Paragraph({
        children: [new TextRun({
          text: nombreMostrar,
          bold: true,
          size: 32,
          font: "Arial"
        })],
        heading: HeadingLevel.HEADING_1
      }),
      crearTexto(`Días asistidos / Total: ${totalAsistencias} / ${total}`),
      crearTexto(`Porcentaje: ${porcentaje}%`),
      crearTexto("Asistencias:"),
      ...asistencias,
      crearTexto("")
    ];
  };

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        crearTexto(`Resumen generado el ${fechaGeneracion}`, { italic: true, size: 24 }),
        crearTexto(""),
        ...getPersonaDoc('diego', 'Diego'),
        ...getPersonaDoc('sandra', 'Sandra')
      ]
    }]
  });

  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resumen-asistencia.docx';
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generando el DOCX:", error);
    alert("Hubo un problema generando el archivo.");
  }
});

renderEvents();