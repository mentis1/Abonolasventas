let events = JSON.parse(localStorage.getItem('abonoEventos')) || [];

function saveEvents() {
  localStorage.setItem('abonoEventos', JSON.stringify(events));
  updateStats();
  sendToGoogleSheets(); // Guarda en Google Sheets
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
        if (events[index].asistencia !== btn.value) {
          events[index].asistencia = btn.value;
          saveEvents();
          updateStats();
          options.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
          b.classList.add('selected');
        }
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

document.getElementById('saveBtn').addEventListener('click', () => {
  saveEvents(); // Guarda en local y en Google Sheets
});

function sendToGoogleSheets() {
  const btn = document.getElementById("saveBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ Guardando...";

  fetch("https://script.google.com/macros/s/AKfycbxxbjl0P6RWNIBVRMffHS_mg23PcTBTIcevNc8JOtvqlda_nD_SZuO33EmNuM05WE8O/exec", {
    method: "POST",
    body: JSON.stringify(events),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(res => {
    if (res.ok) {
      btn.textContent = "✅ Guardado";
    } else {
      btn.textContent = "❌ Error al guardar";
    }
  })
  .catch(() => {
    btn.textContent = "❌ Error de conexión";
  })
  .finally(() => {
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
  });
}
