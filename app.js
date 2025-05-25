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
    title.addEventListener('blur', e => {
      if (events[index].nombre !== e.target.value) {
        events[index].nombre = e.target.value;
        saveEvents();
      }
    });

    const date = document.createElement('input');
    date.type = 'date';
    date.value = event.fecha;
    date.min = '2025-01-01';
    date.addEventListener('blur', e => {
      if (events[index].fecha !== e.target.value) {
        events[index].fecha = e.target.value;
        saveEvents();
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
        events[index].asistencia = btn.value;
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
  const total = events.length;
  if (total === 0) return;

  const getStats = (persona) => {
    const count = events.filter(e => e.asistencia === persona || e.asistencia === 'ambos').length;
    const porcentaje = total ? Math.round((count / total) * 100) : 0;
    return [`${count} / ${total}`, `${porcentaje}%`];
  };

  const [diegoResumen, sandraResumen] = [getStats('diego'), getStats('sandra')];

  const csvRows = [
    ['Nombre', 'Días asistidos / Total', 'Porcentaje'],
    ['Diego', ...diegoResumen],
    ['Sandra', ...sandraResumen]
  ];

  const csvContent = '\uFEFF' + csvRows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'resumen-asistencia.csv';
  a.click();
  URL.revokeObjectURL(url);
});
