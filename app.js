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

  events.forEach((event, index) => {
    const card = document.createElement('div');
    card.className = 'eventCard';

    const title = document.createElement('input');
    title.className = 'eventTitle';
    title.value = event.nombre;
    title.placeholder = 'Nombre del evento...';
    title.addEventListener('input', e => {
      events[index].nombre = e.target.value;
      saveEvents();
    });

    const date = document.createElement('input');
    date.type = 'date';
    date.value = event.fecha;
    date.min = '2025-01-01';
    date.addEventListener('input', e => {
      events[index].fecha = e.target.value;
      saveEvents();
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
        events[index].asistencia = btn.value;
        saveEvents();
        renderEvents();
      });
      options.appendChild(b);
    });

    const del = document.createElement('button');
    del.className = 'deleteBtn';
    del.textContent = 'Eliminar';
    del.addEventListener('click', () => {
      events.splice(index, 1);
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

document.getElementById('exportBtn').addEventListener('click', () => {
  if (events.length === 0) return;

  // Ordenar eventos por fecha
  const sortedEvents = [...events].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const total = sortedEvents.length;

  // 1. Fila 1: Cabecera con fechas
  const headerRow = ['Nombre', 'Días asistidos / Total', 'Porcentaje'];
  sortedEvents.forEach(event => {
    const date = new Date(event.fecha);
    const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    headerRow.push(formattedDate);
  });

  // 2. Fila 2: Nombres de eventos debajo de las fechas
  const eventNameRow = ['', '', ''];
  sortedEvents.forEach(event => {
    eventNameRow.push(event.nombre || '(Sin nombre)');
  });

  // 3. Fila 3 y 4: Diego y Sandra
  const getRow = (persona) => {
    const asistenciaCount = sortedEvents.filter(e =>
      e.asistencia === persona || e.asistencia === 'ambos'
    ).length;
    const porcentaje = total ? Math.round((asistenciaCount / total) * 100) : 0;
    const row = [persona.charAt(0).toUpperCase() + persona.slice(1), `${asistenciaCount} / ${total}`, `${porcentaje}%`];

    sortedEvents.forEach(event => {
      if (event.asistencia === 'ambos' || event.asistencia === persona) {
        row.push('✔️');
      } else {
        row.push('❌');
      }
    });

    return row;
  };

  const diegoRow = getRow('diego');
  const sandraRow = getRow('sandra');

  // Generar CSV
  const csvRows = [headerRow, eventNameRow, diegoRow, sandraRow];
  const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  // Descargar archivo
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'abono-las-ventas.csv';
  a.click();
  URL.revokeObjectURL(url);
});
