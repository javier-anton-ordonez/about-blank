// Canvas para el fondo con partículas y líneas geométricas
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();

// Sistema de partículas minimalista
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.size = Math.random() * 2 + 1;
    this.opacity = Math.random() * 0.5 + 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }

  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Líneas geométricas de fondo
class GeometricLine {
  constructor() {
    this.x1 = Math.random() * canvas.width;
    this.y1 = Math.random() * canvas.height;
    this.x2 = Math.random() * canvas.width;
    this.y2 = Math.random() * canvas.height;
    this.opacity = Math.random() * 0.1 + 0.02;
    this.speed = Math.random() * 0.2 + 0.1;
    this.angle = Math.random() * Math.PI * 2;
  }

  update() {
    this.angle += this.speed * 0.01;
    this.opacity = Math.sin(this.angle) * 0.05 + 0.05;
  }

  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
  }
}

const particles = Array.from({length: 50}, () => new Particle());
const lines = Array.from({length: 8}, () => new GeometricLine());

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Dibujar líneas geométricas
  lines.forEach(line => {
    line.update();
    line.draw();
  });
  
  // Dibujar partículas
  particles.forEach(particle => {
    particle.update();
    particle.draw();
  });
  
  // Conectar partículas cercanas
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 120) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
  
  requestAnimationFrame(animate);
}

animate();

// Uptime counter -> cambiar por hora local
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('es-ES', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  document.getElementById('uptime').textContent = timeString;
}

setInterval(updateTime, 1000);
updateTime(); // Ejecutar inmediatamente

// Sistema de comandos
const commandInput = document.getElementById('commandInput');
const commandOutput = document.getElementById('commandOutput');
const mainCategories = document.getElementById('mainCategories');
const expandedView = document.getElementById('expandedView');
const expandedTitle = document.getElementById('expandedTitle');
const expandedList = document.getElementById('expandedList');

// Storage para funcionalidades
let shortUrls = JSON.parse(localStorage.getItem('Javier_shortcuts') || '{}');
let personalNotes = JSON.parse(localStorage.getItem('Javier_notes') || '[]');
let shortCounter = parseInt(localStorage.getItem('Javier_counter') || '1000');

let extendedCategories = {};

async function loadLinks() {
try {
  const res = await fetch('links.json');
  extendedCategories = await res.json();
  renderMainCategories();
} catch (err) {
  console.error('Error loading links.json:', err);
}
}

// Renderiza la vista principal usando los 3 primeros enlaces de cada categoría del JSON
function renderMainCategories() {
mainCategories.innerHTML = '';
for (const category in extendedCategories) {
  const column = document.createElement('div');
  column.className = 'column';

  const title = document.createElement('div');
  title.className = 'column-title';
  title.textContent = category;

  const ul = document.createElement('ul');
  ul.className = 'site-list';

  // Mostramos solo los 3 primeros
  extendedCategories[category].slice(0, 3).forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.url;
    a.target = '_blank';
    a.textContent = item.name;
    li.appendChild(a);
    ul.appendChild(li);
  });

  column.appendChild(title);
  column.appendChild(ul);
  mainCategories.appendChild(column);
}
}

// Modifica showExpandedCategory para usar la lista cargada
function showExpandedCategory(category) {
const items = extendedCategories[category];
if (!items) return false;

expandedTitle.textContent = category;
expandedList.innerHTML = '';

items.forEach(item => {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = item.url;
  a.target = '_blank';
  a.textContent = item.name;
  li.appendChild(a);
  expandedList.appendChild(li);
});

mainCategories.style.display = 'none';
expandedView.style.display = 'block';
commandOutput.innerHTML = `<span style="color: var(--accent-cyan);">Showing ${category} category (${items.length} items)</span>`;

return true;
}

// Llama a loadLinks en el arranque
loadLinks();

// Función para generar ID corto
function generateShortId() {
  shortCounter++;
  localStorage.setItem('Javier_counter', shortCounter.toString());
  return shortCounter.toString(36);
}

// Función para acortar URL
function shortenUrl(url) {
  // Validar URL básico
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  const shortId = generateShortId();
  const shortUrl = `j.os/${shortId}`;
  
  shortUrls[shortId] = {
    url: url,
    created: new Date().toISOString(),
    clicks: 0
  };
  
  localStorage.setItem('Javier_shortcuts', JSON.stringify(shortUrls));
  return shortUrl;
}

// Función para obtener clima
async function getWeather(city = 'Madrid') {
  try {
    // Simulación de clima (reemplaza por API real si quieres datos reales)
    const weatherData = {
      'madrid': { temp: '22°C', desc: 'Soleado', humidity: '45%', wind: '12 km/h' },
      'barcelona': { temp: '24°C', desc: 'Parcialmente nublado', humidity: '58%', wind: '8 km/h' },
      'valencia': { temp: '26°C', desc: 'Despejado', humidity: '42%', wind: '15 km/h' },
      'bilbao': { temp: '18°C', desc: 'Lluvioso', humidity: '78%', wind: '20 km/h' },
    };
    
    const data = weatherData[city.toLowerCase()] || weatherData['madrid'];
    return `
      <span style="color: var(--accent-cyan);">Weather for ${city.charAt(0).toUpperCase() + city.slice(1)}:</span><br>
      <span style="color: var(--text-secondary);">
      Temperature: ${data.temp}<br>
      Condition: ${data.desc}<br>
      Humidity: ${data.humidity}<br>
      Wind: ${data.wind}
      </span>
    `;
  } catch (error) {
    return `<span style="color: var(--accent-orange);">Error fetching weather data</span>`;
  }
}

// Función para añadir nota
function addNote(noteText) {
  const note = {
    id: Date.now(),
    text: noteText,
    created: new Date().toLocaleString('es-ES'),
  };
  
  personalNotes.unshift(note);
  localStorage.setItem('Javier_notes', JSON.stringify(personalNotes));
  return note;
}

// Función para mostrar notas
function showNotes() {
  if (personalNotes.length === 0) {
    return '<span style="color: var(--text-secondary);">No notes found. Use "note your text here" to create one.</span>';
  }
  
  let output = `<span style="color: var(--accent-cyan);">Your Notes (${personalNotes.length}):</span><br>`;
  personalNotes.slice(0, 10).forEach((note, index) => {
    output += `<span style="color: var(--text-secondary);">${index + 1}. ${note.text}</span><br>`;
    output += `<span style="color: var(--text-muted); font-size: 0.8em;">   ${note.created}</span><br>`;
  });
  
  if (personalNotes.length > 10) {
    output += `<span style="color: var(--text-muted);">... and ${personalNotes.length - 10} more</span>`;
  }
  
  return output;
}

// Función para mostrar categoría expandida
function showExpandedCategory(category) {
  const items = extendedCategories[category];
  if (!items) return false;

  expandedTitle.textContent = category;
  expandedList.innerHTML = '';
  
  items.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.url;
    a.target = '_blank';
    a.textContent = item.name;
    li.appendChild(a);
    expandedList.appendChild(li);
  });

  mainCategories.style.display = 'none';
  expandedView.style.display = 'block';
  commandOutput.innerHTML = `<span style="color: var(--accent-cyan);">Showing ${category} category (${items.length} items)</span>`;
  
  return true;
}

// Función para volver a la vista principal
function showMainView() {
  mainCategories.style.display = 'grid';
  expandedView.style.display = 'none';
  commandOutput.innerHTML = '<span style="color: var(--accent-cyan);">Showing all categories</span>';
}

// Manejador de comandos
commandInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const fullCommand = commandInput.value.trim();
    const parts = fullCommand.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    
    commandInput.value = '';
    
    if (fullCommand === '') return;
    
    // Comando back/ls
    if (command === 'back' || command === 'ls') {
      showMainView();
      return;
    }
    
    // Comando help
    if (command === 'help') {
      commandOutput.innerHTML = `
        <span style="color: var(--accent-orange);">Javier Commands:</span><br>
        <span style="color: var(--text-secondary);">
        <strong>Navigation:</strong><br>
        • emprendimiento/ocio/apuntes/utils - Show category bookmarks<br>
        • back / ls - Return to main view<br><br>
        <strong>Utilities:</strong><br>
        • short &lt;url&gt; - Create short URL (j.os/abc)<br>
        • shorts - Show all shortened URLs<br>
        • note &lt;text&gt; - Save a quick note<br>
        • notes - Show all your notes<br>
        • weather [city] - Get weather info<br><br>
        <strong>System:</strong><br>
        • clear - Clear output<br>
        • help - Show this help
        </span>
      `;
      return;
    }
    
    // Comando clear
    if (command === 'clear') {
      commandOutput.innerHTML = '';
      return;
    }
    
    // Comando short
    if (command === 'short') {
      if (!args) {
        commandOutput.innerHTML = '<span style="color: var(--accent-orange);">Usage: short &lt;url&gt;</span>';
        return;
      }
      
      const shortUrl = shortenUrl(args);
      commandOutput.innerHTML = `
        <span style="color: var(--accent-cyan);">URL shortened successfully!</span><br>
        <span style="color: var(--text-secondary);">Original: ${args}</span><br>
        <span style="color: var(--accent-orange);">Short: ${shortUrl}</span><br>
        <span style="color: var(--text-muted); font-size: 0.8em;">Click to copy: </span><span style="color: var(--accent-cyan); cursor: pointer;" onclick="navigator.clipboard.writeText('${shortUrl}'); this.textContent = 'Copied!'">${shortUrl}</span>
      `;
      return;
    }
    
    // Comando shorts
    if (command === 'shorts') {
      const shortList = Object.entries(shortUrls);
      if (shortList.length === 0) {
        commandOutput.innerHTML = '<span style="color: var(--text-secondary);">No shortened URLs found. Use "short &lt;url&gt;" to create one.</span>';
        return;
      }
      
      let output = `<span style="color: var(--accent-cyan);">Your Shortened URLs (${shortList.length}):</span><br>`;
      shortList.slice(0, 10).forEach(([id, data]) => {
        const date = new Date(data.created).toLocaleDateString('es-ES');
        output += `<span style="color: var(--accent-orange);">j.os/${id}</span> → <span style="color: var(--text-secondary);">${data.url.substring(0, 60)}${data.url.length > 60 ? '...' : ''}</span><br>`;
        output += `<span style="color: var(--text-muted); font-size: 0.8em;">   Created: ${date} | Clicks: ${data.clicks}</span><br>`;
      });
      
      if (shortList.length > 10) {
        output += `<span style="color: var(--text-muted);">... and ${shortList.length - 10} more</span>`;
      }
      
      commandOutput.innerHTML = output;
      return;
    }
    
    // Comando note
    if (command === 'note') {
      if (!args) {
        commandOutput.innerHTML = '<span style="color: var(--accent-orange);">Usage: note &lt;your note text&gt;</span>';
        return;
      }
      
      const note = addNote(args);
      commandOutput.innerHTML = `
        <span style="color: var(--accent-cyan);">Note saved!</span><br>
        <span style="color: var(--text-secondary);">"${note.text}"</span><br>
        <span style="color: var(--text-muted); font-size: 0.8em;">${note.created}</span>
      `;
      return;
    }
    
    // Comando notes
    if (command === 'notes') {
      commandOutput.innerHTML = showNotes();
      return;
    }
    
    // Comando weather
    if (command === 'weather') {
      const city = args || 'Madrid';
      commandOutput.innerHTML = '<span style="color: var(--text-secondary);">Loading weather data...</span>';
      
      setTimeout(async () => {
        const weatherInfo = await getWeather(city);
        commandOutput.innerHTML = weatherInfo;
      }, 500);
      return;
    }
    
    // Intentar mostrar categoría
    if (extendedCategories[command]) {
      showExpandedCategory(command);
    } else {
      commandOutput.innerHTML = `<span style="color: var(--accent-orange);">Command not found: ${command}</span><br><span style="color: var(--text-secondary);">Type 'help' for available commands</span>`;
    }
  }
});

// Focus automático en el input
commandInput.focus();

// Refocus cuando se hace click en cualquier parte
document.addEventListener('click', (e) => {
  if (!e.target.matches('a') && !e.target.matches('button')) {
    commandInput.focus();
  }
});

// Redimensionado del canvas
window.addEventListener('resize', () => {
  resizeCanvas();
  // Reposicionar partículas que estén fuera del canvas
  particles.forEach(particle => {
    if (particle.x > canvas.width) particle.x = canvas.width;
    if (particle.y > canvas.height) particle.y = canvas.height;
  });
});

// Efectos de interacción con la terminal
const terminal = document.querySelector('.terminal');
const terminalContainer = document.querySelector('.terminal-container');

// Efecto hover en la terminal
terminal.addEventListener('mouseenter', () => {
  terminal.style.boxShadow = `
    0 20px 40px rgba(0,0,0,0.8),
    0 0 0 1px #333333,
    0 0 20px rgba(0,212,255,0.1)
  `;
});

terminal.addEventListener('mouseleave', () => {
  terminal.style.boxShadow = `
    0 20px 40px rgba(0,0,0,0.6),
    0 0 0 1px #2a2a2a
  `;
});

// Shortcuts de teclado
document.addEventListener('keydown', (e) => {
  // Ctrl + / para mostrar ayuda
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    console.log('Javier Shortcuts:');
    console.log('Ctrl + / : Show help');
    console.log('Ctrl + R : Reload');
    console.log('Ctrl + F : Focus search');
  }
});
